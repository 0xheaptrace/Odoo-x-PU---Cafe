// Floor routes — floors and table management
const express = require('express')
const { getAllFloors, createFloor, addTable } = require('../controllers/floorController')
const protect = require('../middleware/protect')
const { adminOnly } = require('../middleware/roleGuard')

const router = express.Router()

router.get('/', getAllFloors)
router.post('/', protect, adminOnly, createFloor)
router.post('/:id/tables', protect, adminOnly, addTable)

module.exports = router
