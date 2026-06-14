// Floor controller — manage floors and their tables
const prisma = require('../lib/prisma')
const { serializeDoc } = require('../lib/serialize')
const { getId, pickDefined } = require('../utils/requestMapping')

// Get all floors with their tables nested
const getAllFloors = async (req, res) => {
  try {
    const floors = await prisma.floor.findMany({
      include: { tables: true },
    })
    res.status(200).json(floors.map(serializeDoc))
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// Create a new floor
const createFloor = async (req, res) => {
  try {
    const { name } = req.body

    if (!name) {
      return res.status(400).json({ message: 'Floor name is required' })
    }

    const floor = await prisma.floor.create({ data: { name } })
    res.status(201).json({ ...serializeDoc(floor), tables: [] })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// Add a table to a specific floor
const addTable = async (req, res) => {
  try {
    const floor = await prisma.floor.findUnique({ where: { id: req.params.id } })
    if (!floor) {
      return res.status(404).json({ message: 'Floor not found' })
    }

    const { tableNumber, seats } = req.body
    if (!tableNumber || !seats) {
      return res.status(400).json({ message: 'Table number and seats are required' })
    }

    const table = await prisma.diningTable.create({
      data: {
        tableNumber,
        seats,
        floorId: floor.id,
      },
    })

    res.status(201).json(serializeDoc(table))
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// Update table details
const updateTable = async (req, res) => {
  try {
    if (
      req.body.currentStatus &&
      !['available', 'reserved', 'occupied', 'cleaning'].includes(req.body.currentStatus)
    ) {
      return res.status(400).json({ message: 'Invalid table status' })
    }

    const data = pickDefined(req.body, [
      'tableNumber',
      'seats',
      'isActive',
      'currentStatus',
    ])
    const floor = req.body.floor ?? req.body.floorId
    if (floor !== undefined) data.floorId = getId(floor)

    const table = await prisma.diningTable.update({
      where: { id: req.params.id },
      data,
    })

    const io = req.app.get('io')
    if (io) {
      io.to('updates').emit('table_updated', serializeDoc(table))
      io.to('kitchen').emit('table_updated', serializeDoc(table))
    }

    res.status(200).json(serializeDoc(table))
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Table not found' })
    }
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// Delete a table
const deleteTable = async (req, res) => {
  try {
    await prisma.diningTable.delete({ where: { id: req.params.id } })
    res.status(200).json({ message: 'Table deleted successfully' })
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Table not found' })
    }
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

module.exports = { getAllFloors, createFloor, addTable, updateTable, deleteTable }
