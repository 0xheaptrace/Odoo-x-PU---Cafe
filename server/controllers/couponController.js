// Coupon controller — manage discount codes
const prisma = require('../lib/prisma')
const { serializeDoc } = require('../lib/serialize')
const { pickDefined } = require('../utils/requestMapping')

const couponFields = ['code', 'discountType', 'discountValue', 'isActive']

const mapCouponBody = (body) => {
  const data = pickDefined(body, couponFields)
  if (data.code) data.code = data.code.toUpperCase()
  return data
}

// Get all coupons
const getAllCoupons = async (req, res) => {
  try {
    const coupons = await prisma.coupon.findMany()
    res.status(200).json(coupons.map(serializeDoc))
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// Create a new coupon
const createCoupon = async (req, res) => {
  try {
    const data = mapCouponBody(req.body)

    const coupon = await prisma.coupon.create({ data })
    res.status(201).json(serializeDoc(coupon))
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// Update an existing coupon
const updateCoupon = async (req, res) => {
  try {
    const data = mapCouponBody(req.body)

    const coupon = await prisma.coupon.update({
      where: { id: req.params.id },
      data,
    })

    res.status(200).json(serializeDoc(coupon))
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Coupon not found' })
    }
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// Delete a coupon
const deleteCoupon = async (req, res) => {
  try {
    await prisma.coupon.delete({ where: { id: req.params.id } })
    res.status(200).json({ message: 'Coupon deleted successfully' })
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Coupon not found' })
    }
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// Validate a coupon code and return discount details
const validateCoupon = async (req, res) => {
  try {
    const { code } = req.body

    if (!code) {
      return res.status(400).json({ message: 'Coupon code is required' })
    }

    const coupon = await prisma.coupon.findFirst({
      where: { code: code.toUpperCase(), isActive: true },
    })

    if (!coupon) {
      return res.status(404).json({ message: 'Invalid or inactive coupon' })
    }

    res.status(200).json({
      valid: true,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
    })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

module.exports = { getAllCoupons, createCoupon, updateCoupon, deleteCoupon, validateCoupon }
