// Product routes — public read, admin write
const express = require('express')
const {
  getAllProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController')
const protect = require('../middleware/protect')
const { adminOnly } = require('../middleware/roleGuard')

const router = express.Router()

router.get('/', getAllProducts)
router.post('/', protect, adminOnly, createProduct)
router.put('/:id', protect, adminOnly, updateProduct)
router.delete('/:id', protect, adminOnly, deleteProduct)

module.exports = router
