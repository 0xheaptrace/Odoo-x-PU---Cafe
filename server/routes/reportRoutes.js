// Report routes — admin analytics dashboard
const express = require('express')
const {
  getSummary,
  getSalesTrend,
  getTopProducts,
  getTopCategories,
  getTopOrders,
  getPeakHours,
  getRevenuePerTable,
} = require('../controllers/reportController')
const protect = require('../middleware/protect')
const { adminOnly } = require('../middleware/roleGuard')

const router = express.Router()

router.use(protect, adminOnly)

router.get('/summary', getSummary)
router.get('/sales-trend', getSalesTrend)
router.get('/top-products', getTopProducts)
router.get('/top-categories', getTopCategories)
router.get('/top-orders', getTopOrders)
router.get('/peak-hours', getPeakHours)
router.get('/revenue-per-table', getRevenuePerTable)

module.exports = router
