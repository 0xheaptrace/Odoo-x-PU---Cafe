// Product controller — manage menu products
const prisma = require('../lib/prisma')
const { serializeDoc } = require('../lib/serialize')
const { getId, pickDefined } = require('../utils/requestMapping')

const productFields = [
  'name',
  'price',
  'unitOfMeasure',
  'tax',
  'description',
  'isAvailableOnKDS',
  'isActive',
]

const mapProductBody = (body) => {
  const data = pickDefined(body, productFields)
  const category = body.category ?? body.categoryId

  if (category !== undefined) {
    data.categoryId = getId(category)
  }

  return data
}

// Get all products with category populated
const getAllProducts = async (req, res) => {
  try {
    const products = await prisma.product.findMany({ include: { category: true } })
    res.status(200).json(products.map(serializeDoc))
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// Create a new product
const createProduct = async (req, res) => {
  try {
    const data = mapProductBody(req.body)
    const product = await prisma.product.create({
      data,
      include: { category: true },
    })
    res.status(201).json(serializeDoc(product))
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// Update an existing product
const updateProduct = async (req, res) => {
  try {
    const data = mapProductBody(req.body)

    const product = await prisma.product.update({
      where: { id: req.params.id },
      data,
      include: { category: true },
    })

    res.status(200).json(serializeDoc(product))
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Product not found' })
    }
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// Delete a product
const deleteProduct = async (req, res) => {
  try {
    await prisma.product.delete({ where: { id: req.params.id } })
    res.status(200).json({ message: 'Product deleted successfully' })
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Product not found' })
    }
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

module.exports = { getAllProducts, createProduct, updateProduct, deleteProduct }
