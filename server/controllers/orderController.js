// Order controller — full POS order lifecycle
const prisma = require('../lib/prisma')
const { serializeDoc, orderInclude, mapOrderStatusFromApi } = require('../lib/serialize')
const { generateOrderNumber, mapOrderBody, mapOrderUpdateBody } = require('../utils/orderHelpers')
const { sendReceiptEmail } = require('../utils/emailSender')

// Fetch a single order with all relations
const fetchOrder = (id) =>
  prisma.order.findUnique({
    where: { id },
    include: orderInclude,
  })

const emitLifecycle = (req, event, payload) => {
  const io = req.app.get('io')
  if (!io) return
  io.to('updates').emit(event, payload)
  io.to('kitchen').emit(event, payload)
}

const completeMatchingReservation = async ({ tableId, customerId }) => {
  if (!tableId) return null

  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(end.getDate() + 1)

  const booking = await prisma.booking.findFirst({
    where: {
      tableId,
      ...(customerId ? { customerId } : {}),
      status: 'confirmed',
      date: { gte: start, lt: end },
    },
    orderBy: { date: 'desc' },
  })

  if (!booking) return null

  return prisma.booking.update({
    where: { id: booking.id },
    data: { status: 'completed' },
    include: { customer: true, table: true, floor: true },
  })
}

// Get orders filtered by status, session, date, or the logged-in customer
const getAllOrders = async (req, res) => {
  try {
    const where = {}

    if (req.user.role === 'customer') {
      const customer = await prisma.customer.findFirst({
        where: {
          OR: [
            { email: req.user.email },
            { phone: req.user.phone || undefined },
          ].filter((condition) => Object.values(condition)[0]),
        },
      })

      where.customerId = customer?.id || '__no_customer_orders__'
    } else if (req.query.customer) {
      where.customerId = req.query.customer
    }

    if (req.query.status) {
      if (req.query.status === 'paid') {
        where.paymentStatus = 'paid'
      } else if (req.query.status === 'draft') {
        where.paymentStatus = 'unpaid'
      } else {
        where.status = mapOrderStatusFromApi(req.query.status)
      }
    }
    if (req.query.paymentStatus) where.paymentStatus = req.query.paymentStatus
    if (req.query.table) where.tableId = req.query.table
    if (req.query.active === 'true') {
      where.paymentStatus = 'unpaid'
      where.status = { notIn: ['completed', 'cancelled', 'paid'] }
    }
    if (req.query.session) where.sessionId = req.query.session
    if (req.query.date) {
      const date = new Date(req.query.date)
      const nextDay = new Date(date)
      nextDay.setDate(nextDay.getDate() + 1)
      where.createdAt = { gte: date, lt: nextDay }
    }

    const orders = await prisma.order.findMany({
      where,
      include: orderInclude,
      orderBy: { createdAt: 'desc' },
    })

    res.status(200).json(orders.map(serializeDoc))
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// Create a new draft order with auto-generated order number
const createOrder = async (req, res) => {
  try {
    const session = await prisma.session.findFirst({ where: { isOpen: true } })
    const orderData = mapOrderBody(req.body)

    const order = await prisma.order.create({
      data: {
        ...orderData,
        orderNumber: await generateOrderNumber(),
        employeeId: req.user.id,
        sessionId: session?.id || null,
        status: orderData.status || 'pending',
        paymentStatus: orderData.paymentStatus || 'unpaid',
      },
      include: orderInclude,
    })

    if (order.tableId) {
      await prisma.diningTable.update({
        where: { id: order.tableId },
        data: { currentStatus: 'occupied' },
      })
    }

    const updated = await fetchOrder(order.id)
    emitLifecycle(req, 'order_updated', serializeDoc(updated))
    if (updated.table) emitLifecycle(req, 'table_updated', serializeDoc(updated.table))

    res.status(201).json(serializeDoc(updated))
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// Update a draft order's items and totals
const updateOrder = async (req, res) => {
  try {
    const order = await prisma.order.findUnique({ where: { id: req.params.id } })
    if (!order) {
      return res.status(404).json({ message: 'Order not found' })
    }

    if (order.paymentStatus === 'paid' || ['completed', 'cancelled', 'paid'].includes(order.status)) {
      return res.status(400).json({ message: 'Only active unpaid orders can be updated' })
    }

    const updated = await prisma.order.update({
      where: { id: req.params.id },
      data: mapOrderUpdateBody(req.body),
      include: orderInclude,
    })

    emitLifecycle(req, 'order_updated', serializeDoc(updated))
    res.status(200).json(serializeDoc(updated))
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// Delete a draft order only
const deleteOrder = async (req, res) => {
  try {
    const order = await prisma.order.findUnique({ where: { id: req.params.id } })
    if (!order) {
      return res.status(404).json({ message: 'Order not found' })
    }

    if (order.paymentStatus === 'paid' || ['completed', 'cancelled', 'paid'].includes(order.status)) {
      return res.status(400).json({ message: 'Only active unpaid orders can be deleted' })
    }

    if (order.tableId) {
      await prisma.diningTable.update({
        where: { id: order.tableId },
        data: { currentStatus: 'available' },
      })
    }

    await prisma.order.delete({ where: { id: req.params.id } })
    emitLifecycle(req, 'order_deleted', { orderId: req.params.id })
    res.status(200).json({ message: 'Order deleted successfully' })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// Send order items to kitchen and emit socket event
const sendToKitchen = async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: { items: true },
    })

    if (!order) {
      return res.status(404).json({ message: 'Order not found' })
    }

    await prisma.orderItem.updateMany({
      where: { orderId: order.id, sentToKitchen: false },
      data: { sentToKitchen: true, kitchenStatus: 'to_cook' },
    })

    await prisma.order.update({
      where: { id: order.id },
      data: { status: 'pending', paymentStatus: 'unpaid' },
    })

    const io = req.app.get('io')
    const updated = await fetchOrder(order.id)

    if (io) {
      io.to('kitchen').emit('new_order', {
        orderId: updated.id,
        orderNumber: updated.orderNumber,
        items: updated.items.map(serializeDoc),
      })
      io.to('updates').emit('order_updated', serializeDoc(updated))
    }

    res.status(200).json(serializeDoc(updated))
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// Process payment and mark order as paid
const processPayment = async (req, res) => {
  try {
    const order = await prisma.order.findUnique({ where: { id: req.params.id } })
    if (!order) {
      return res.status(404).json({ message: 'Order not found' })
    }

    if (order.paymentStatus === 'paid') {
      return res.status(400).json({ message: 'Order is already paid' })
    }

    const { paymentMethod, cashReceived, cardTransactionRef } = req.body
    const updateData = {
      paymentMethod,
      status: 'completed',
      paymentStatus: 'paid',
    }

    if (paymentMethod === 'cash' && cashReceived) {
      updateData.cashReceived = cashReceived
      updateData.changeGiven = cashReceived - order.total
    }

    if (paymentMethod === 'card' && cardTransactionRef) {
      updateData.cardTransactionRef = cardTransactionRef
    }

    await prisma.order.update({
      where: { id: order.id },
      data: updateData,
    })

    let updatedTable = null
    if (order.tableId) {
      updatedTable = await prisma.diningTable.update({
        where: { id: order.tableId },
        data: { currentStatus: 'available' },
      })
    }

    const completedBooking = await completeMatchingReservation({
      tableId: order.tableId,
      customerId: order.customerId,
    })

    if (order.sessionId) {
      await prisma.session.update({
        where: { id: order.sessionId },
        data: { totalOrders: { increment: 1 } },
      })
    }

    const updated = await fetchOrder(order.id)
    emitLifecycle(req, 'payment_updated', serializeDoc(updated))
    emitLifecycle(req, 'order_updated', serializeDoc(updated))
    if (updatedTable) emitLifecycle(req, 'table_updated', serializeDoc(updatedTable))
    if (completedBooking) emitLifecycle(req, 'booking_updated', serializeDoc(completedBooking))
    res.status(200).json(serializeDoc(updated))
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// Send receipt email to customer
const sendReceipt = async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: { customer: true, items: true },
    })

    if (!order) {
      return res.status(404).json({ message: 'Order not found' })
    }

    const { email } = req.body
    let customer = order.customer

    if (!customer && email) {
      customer = { name: 'Customer', email }
    } else if (email && customer) {
      customer = { ...customer, email }
    }

    if (!customer?.email) {
      return res.status(400).json({ message: 'Customer email is required' })
    }

    await sendReceiptEmail(customer, order)

    await prisma.order.update({
      where: { id: order.id },
      data: { receiptEmailSent: true },
    })

    res.status(200).json({ message: 'Receipt sent successfully' })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

const updateOrderStatus = async (req, res) => {
  try {
    const status = mapOrderStatusFromApi(req.body.status || req.body.orderStatus)
    const validStatuses = ['pending', 'preparing', 'ready', 'served', 'completed', 'cancelled']
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid order status' })
    }

    const order = await prisma.order.findUnique({ where: { id: req.params.id } })
    if (!order) {
      return res.status(404).json({ message: 'Order not found' })
    }

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: { status },
      include: orderInclude,
    })

    emitLifecycle(req, 'order_updated', serializeDoc(updated))
    res.status(200).json(serializeDoc(updated))
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

module.exports = {
  getAllOrders,
  createOrder,
  updateOrder,
  deleteOrder,
  sendToKitchen,
  processPayment,
  sendReceipt,
  updateOrderStatus,
}
