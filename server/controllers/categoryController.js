// Category controller — manage product categories
const prisma = require('../lib/prisma')
const { serializeDoc } = require('../lib/serialize')
const { pickDefined } = require('../utils/requestMapping')

// Get all categories
const getAllCategories = async (req, res) => {
  try {
    const categories = await prisma.category.findMany()
    res.status(200).json(categories.map(serializeDoc))
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// Create a new category
const createCategory = async (req, res) => {
  try {
    const { name, color } = req.body

    if (!name || !color) {
      return res.status(400).json({ message: 'Name and color are required' })
    }

    const category = await prisma.category.create({ data: { name, color } })
    res.status(201).json(serializeDoc(category))
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// Update an existing category
const updateCategory = async (req, res) => {
  try {
    const category = await prisma.category.update({
      where: { id: req.params.id },
      data: pickDefined(req.body, ['name', 'color']),
    })

    res.status(200).json(serializeDoc(category))
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Category not found' })
    }
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// Delete a category
const deleteCategory = async (req, res) => {
  try {
    await prisma.category.delete({ where: { id: req.params.id } })
    res.status(200).json({ message: 'Category deleted successfully' })
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Category not found' })
    }
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

module.exports = { getAllCategories, createCategory, updateCategory, deleteCategory }
