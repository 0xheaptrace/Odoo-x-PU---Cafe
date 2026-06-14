// Order routes — full POS order lifecycle
const express = require('express')
const {
  getAllOrders,
  createOrder,
  updateOrder,
  deleteOrder,
  sendToKitchen,
  processPayment,
  sendReceipt,
  updateOrderStatus,
} = require('../controllers/orderController')
const protect = require('../middleware/protect')
const { employeeOrAdmin } = require('../middleware/roleGuard')

const router = express.Router()

router.use(protect)

router.get('/', getAllOrders)
router.use(employeeOrAdmin)
router.post('/', createOrder)
router.put('/:id', updateOrder)
router.delete('/:id', deleteOrder)
router.post('/:id/send-to-kitchen', sendToKitchen)
router.post('/:id/kitchen', sendToKitchen)
router.post('/:id/pay', processPayment)
router.post('/:id/payment', processPayment)
router.patch('/:id/status', updateOrderStatus)
router.post('/:id/status', updateOrderStatus)
router.post('/:id/send-receipt', sendReceipt)
router.post('/:id/receipt', sendReceipt)

module.exports = router
