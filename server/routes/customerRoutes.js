// Customer routes — search and CRUD for POS
const express = require('express')
const {
  getAllCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} = require('../controllers/customerController')
const protect = require('../middleware/protect')
const { employeeOrAdmin } = require('../middleware/roleGuard')

const router = express.Router()

router.use(protect, employeeOrAdmin)

router.get('/', getAllCustomers)
router.post('/', createCustomer)
router.put('/:id', updateCustomer)
router.delete('/:id', deleteCustomer)

module.exports = router
