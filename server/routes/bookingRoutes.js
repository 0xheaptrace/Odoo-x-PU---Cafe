// Booking routes — reservations with email confirmation
const express = require('express')
const {
  getAllBookings,
  createBooking,
  updateBooking,
} = require('../controllers/bookingController')
const protect = require('../middleware/protect')
const { adminOnly, employeeOrAdmin } = require('../middleware/roleGuard')

const router = express.Router()

router.get('/', protect, getAllBookings)
router.post('/', protect, createBooking)
router.put('/:id', protect, employeeOrAdmin, updateBooking)

module.exports = router
