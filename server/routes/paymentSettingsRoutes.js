// Payment settings routes
const express = require('express')
const {
  getPaymentSettings,
  updatePaymentSettings,
} = require('../controllers/paymentSettingsController')
const protect = require('../middleware/protect')
const { adminOnly } = require('../middleware/roleGuard')

const router = express.Router()

router.get('/', protect, getPaymentSettings)
router.put('/', protect, adminOnly, updatePaymentSettings)

module.exports = router
