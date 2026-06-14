// Promotion controller — manage automatic discounts
const prisma = require('../lib/prisma')
const { serializeDoc } = require('../lib/serialize')
const { getId, pickDefined } = require('../utils/requestMapping')

const promotionFields = [
  'name',
  'appliesTo',
  'minimumQuantity',
  'minimumOrderAmount',
  'discountType',
  'discountValue',
  'isActive',
]

const mapPromotionBody = (body) => {
  const data = pickDefined(body, promotionFields)
  const product = body.product ?? body.productId

  if (product !== undefined) {
    data.productId = getId(product) || null
  }

  if (data.appliesTo === 'order') {
    data.productId = null
  }

  return data
}

// Get all active promotions
const getAllPromotions = async (req, res) => {
  try {
    const promotions = await prisma.promotion.findMany({
      where: { isActive: true },
      include: { product: true },
    })
    res.status(200).json(promotions.map(serializeDoc))
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// Create a new promotion
const createPromotion = async (req, res) => {
  try {
    const promotion = await prisma.promotion.create({
      data: mapPromotionBody(req.body),
      include: { product: true },
    })
    res.status(201).json(serializeDoc(promotion))
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// Update an existing promotion
const updatePromotion = async (req, res) => {
  try {
    const promotion = await prisma.promotion.update({
      where: { id: req.params.id },
      data: mapPromotionBody(req.body),
      include: { product: true },
    })

    res.status(200).json(serializeDoc(promotion))
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Promotion not found' })
    }
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// Delete a promotion
const deletePromotion = async (req, res) => {
  try {
    await prisma.promotion.delete({ where: { id: req.params.id } })
    res.status(200).json({ message: 'Promotion deleted successfully' })
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Promotion not found' })
    }
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

module.exports = { getAllPromotions, createPromotion, updatePromotion, deletePromotion }
