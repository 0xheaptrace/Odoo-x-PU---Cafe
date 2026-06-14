// Coupon routes — admin CRUD and employee validation
const express = require('express')
const {
  getAllCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  validateCoupon,
} = require('../controllers/couponController')
const protect = require('../middleware/protect')
const { adminOnly, employeeOrAdmin } = require('../middleware/roleGuard')

const router = express.Router()

router.post('/validate', protect, employeeOrAdmin, validateCoupon)
router.get('/', protect, adminOnly, getAllCoupons)
router.post('/', protect, adminOnly, createCoupon)
router.put('/:id', protect, adminOnly, updateCoupon)
router.delete('/:id', protect, adminOnly, deleteCoupon)

module.exports = router
