// Table routes — update and delete tables (mounted at /api/tables)
const express = require('express')
const { updateTable, deleteTable } = require('../controllers/floorController')
const protect = require('../middleware/protect')
const { adminOnly, employeeOrAdmin } = require('../middleware/roleGuard')

const router = express.Router()

router.put('/:id', protect, employeeOrAdmin, updateTable)
router.delete('/:id', protect, adminOnly, deleteTable)

module.exports = router
