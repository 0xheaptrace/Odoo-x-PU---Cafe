// Category routes — public read, admin write
const express = require('express')
const {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../controllers/categoryController')
const protect = require('../middleware/protect')
const { adminOnly } = require('../middleware/roleGuard')

const router = express.Router()

router.get('/', getAllCategories)
router.post('/', protect, adminOnly, createCategory)
router.put('/:id', protect, adminOnly, updateCategory)
router.delete('/:id', protect, adminOnly, deleteCategory)

module.exports = router
