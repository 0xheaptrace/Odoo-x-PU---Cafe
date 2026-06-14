// Promotion routes — active promotions and admin CRUD
const express = require('express')
const {
  getAllPromotions,
  createPromotion,
  updatePromotion,
  deletePromotion,
} = require('../controllers/promotionController')
const protect = require('../middleware/protect')
const { adminOnly } = require('../middleware/roleGuard')

const router = express.Router()

router.get('/', getAllPromotions)
router.post('/', protect, adminOnly, createPromotion)
router.put('/:id', protect, adminOnly, updatePromotion)
router.delete('/:id', protect, adminOnly, deletePromotion)

module.exports = router
