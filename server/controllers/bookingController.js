// Booking controller — manage table reservations
const prisma = require('../lib/prisma')
const { serializeDoc } = require('../lib/serialize')
const { sendBookingConfirmation } = require('../utils/emailSender')
const { handleControllerError } = require('../utils/controllerError')
const { getId } = require('../utils/requestMapping')

const bookingInclude = {
  customer: true,
  table: true,
  floor: true,
}

const BOOKING_STATUSES = ['confirmed', 'cancelled', 'completed']

const emitBookingLifecycle = (req, event, payload) => {
  const io = req.app.get('io')
  if (!io) return
  io.to('updates').emit(event, payload)
  io.to('kitchen').emit(event, payload)
}

const parseBookingDate = (date) => {
  const parsed = new Date(date)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

const getDateRange = (date) => {
  const start = parseBookingDate(date)
  if (!start) return null
  const end = new Date(start)
  end.setDate(end.getDate() + 1)
  return { gte: start, lt: end }
}

const buildBookingData = ({ customer, table, floor, date, time, numberOfGuests, status }) => {
  const customerId = getId(customer)
  const tableId = getId(table)
  const floorId = getId(floor)
  const bookingDate = parseBookingDate(date)
  const guests = Number.parseInt(numberOfGuests, 10)

  if (!customerId) return { error: 'Customer is required' }
  if (!tableId) return { error: 'Table is required' }
  if (!floorId) return { error: 'Floor is required' }
  if (!bookingDate) return { error: 'Valid booking date is required' }
  if (!time) return { error: 'Booking time is required' }
  if (!Number.isInteger(guests) || guests < 1) {
    return { error: 'Number of guests must be at least 1' }
  }
  if (status && !BOOKING_STATUSES.includes(status)) {
    return { error: 'Invalid booking status' }
  }

  return {
    data: {
      customerId,
      tableId,
      floorId,
      date: bookingDate,
      time,
      numberOfGuests: guests,
      ...(status ? { status } : {}),
    },
  }
}

const validateBookingRelations = async ({ customer, table, floor }) => {
  const [customerRecord, tableRecord, floorRecord] = await Promise.all([
    prisma.customer.findUnique({ where: { id: customer } }),
    prisma.diningTable.findUnique({ where: { id: table } }),
    prisma.floor.findUnique({ where: { id: floor } }),
  ])

  if (!customerRecord) return 'Selected customer was not found'
  if (!tableRecord) return 'Selected table was not found'
  if (!floorRecord) return 'Selected floor was not found'
  if (tableRecord.floorId !== floorRecord.id) {
    return 'Selected table does not belong to selected floor'
  }

  return null
}

// Get bookings — staff see all, customers see their own
const getAllBookings = async (req, res) => {
  try {
    const where = {}
    const availabilityLookup =
      req.query.availability === 'tables' && req.query.date && req.query.time

    if (availabilityLookup) {
      const dateRange = getDateRange(req.query.date)
      if (!dateRange) {
        return res.status(400).json({ message: 'Valid booking date is required' })
      }

      const bookings = await prisma.booking.findMany({
        where: {
          date: dateRange,
          time: req.query.time,
          status: 'confirmed',
        },
        select: {
          id: true,
          tableId: true,
          table: true,
        },
      })

      return res.status(200).json(bookings.map(serializeDoc))
    }

    if (req.user.role === 'customer') {
      const customer = await prisma.customer.findFirst({
        where: { email: req.user.email },
      })
      if (!customer) {
        return res.status(200).json([])
      }
      where.customerId = customer.id
    } else if (!['admin', 'employee'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' })
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: bookingInclude,
      orderBy: { date: 'desc' },
    })

    res.status(200).json(bookings.map(serializeDoc))
  } catch (error) {
    handleControllerError(res, error, 'getAllBookings')
  }
}

// Create a booking and send confirmation email
const createBooking = async (req, res) => {
  try {
    let { customer, table, floor, date, time, numberOfGuests, status } = req.body

    if (req.user.role === 'customer') {
      let profile = await prisma.customer.findFirst({
        where: { email: req.user.email },
      })
      if (!profile) {
        profile = await prisma.customer.create({
          data: { name: req.user.name, email: req.user.email },
        })
      }
      customer = profile.id
    }

    const mapped = buildBookingData({
      customer: customer ?? req.body.customerId,
      table: table ?? req.body.tableId,
      floor: floor ?? req.body.floorId,
      date,
      time,
      numberOfGuests,
      status,
    })

    if (mapped.error) {
      return res.status(400).json({ message: mapped.error })
    }

    const relationError = await validateBookingRelations({
      customer: mapped.data.customerId,
      table: mapped.data.tableId,
      floor: mapped.data.floorId,
    })
    if (relationError) {
      return res.status(400).json({ message: relationError })
    }

    const existingBooking = await prisma.booking.findFirst({
      where: {
        tableId: mapped.data.tableId,
        date: getDateRange(mapped.data.date),
        time: mapped.data.time,
        status: 'confirmed',
      },
    })
    if (existingBooking) {
      return res.status(409).json({ message: 'Selected table is already booked for this date and time' })
    }

    const booking = await prisma.booking.create({
      data: mapped.data,
      include: bookingInclude,
    })

    emitBookingLifecycle(req, 'booking_updated', serializeDoc(booking))

    if (booking.customer?.email) {
      try {
        await sendBookingConfirmation(booking.customer, booking)
        await prisma.booking.update({
          where: { id: booking.id },
          data: { confirmationEmailSent: true },
        })
        booking.confirmationEmailSent = true
      } catch (emailError) {
        console.error('Failed to send booking confirmation email:', emailError.message)
      }
    }

    res.status(201).json(serializeDoc(booking))
  } catch (error) {
    handleControllerError(res, error, 'createBooking')
  }
}

// Update booking status
const updateBooking = async (req, res) => {
  try {
    const existing = await prisma.booking.findUnique({ where: { id: req.params.id } })
    if (!existing) {
      return res.status(404).json({ message: 'Booking not found' })
    }

    const mapped = buildBookingData({
      customer: req.body.customer ?? req.body.customerId ?? existing.customerId,
      table: req.body.table ?? req.body.tableId ?? existing.tableId,
      floor: req.body.floor ?? req.body.floorId ?? existing.floorId,
      date: req.body.date ?? existing.date,
      time: req.body.time ?? existing.time,
      numberOfGuests: req.body.numberOfGuests ?? existing.numberOfGuests,
      status: req.body.status ?? existing.status,
    })

    if (mapped.error) {
      return res.status(400).json({ message: mapped.error })
    }

    const relationError = await validateBookingRelations({
      customer: mapped.data.customerId,
      table: mapped.data.tableId,
      floor: mapped.data.floorId,
    })
    if (relationError) {
      return res.status(400).json({ message: relationError })
    }

    const booking = await prisma.booking.update({
      where: { id: req.params.id },
      data: mapped.data,
      include: bookingInclude,
    })

    emitBookingLifecycle(req, 'booking_updated', serializeDoc(booking))

    res.status(200).json(serializeDoc(booking))
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Booking not found' })
    }
    handleControllerError(res, error, 'updateBooking')
  }
}

module.exports = { getAllBookings, createBooking, updateBooking }
