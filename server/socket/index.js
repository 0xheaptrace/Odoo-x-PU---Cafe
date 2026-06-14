// Socket.io setup — real-time kitchen display system events
const prisma = require('../lib/prisma')
const { mapKitchenStatusFromApi } = require('../lib/serialize')

const initSocket = (io) => {
  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`)

    // Client joins the kitchen room to receive order updates
    socket.on('join_kitchen', () => {
      socket.join('kitchen')
      console.log(`Client ${socket.id} joined kitchen room`)
    })

    socket.on('join_updates', () => {
      socket.join('updates')
      console.log(`Client ${socket.id} joined updates room`)
    })

    // Update kitchen status for an order item
    socket.on('update_order_status', async ({ orderId, itemIndex, newStatus }) => {
      try {
        const order = await prisma.order.findUnique({
          where: { id: orderId },
          include: { items: { orderBy: { id: 'asc' } } },
        })

        if (!order || !order.items[itemIndex]) return

        const item = order.items[itemIndex]
        await prisma.orderItem.update({
          where: { id: item.id },
          data: { kitchenStatus: mapKitchenStatusFromApi(newStatus) },
        })

        const nextOrderStatus =
          newStatus === 'completed'
            ? 'ready'
            : newStatus === 'preparing'
              ? 'preparing'
              : 'pending'

        await prisma.order.update({
          where: { id: order.id },
          data: { status: nextOrderStatus },
        })

        io.to('kitchen').emit('order_status_updated', {
          orderId,
          itemIndex,
          newStatus,
          orderNumber: order.orderNumber,
        })
        io.to('updates').emit('order_updated', {
          orderId,
          itemIndex,
          newStatus,
          orderStatus: nextOrderStatus,
          orderNumber: order.orderNumber,
        })
      } catch (error) {
        console.error('Socket update_order_status error:', error.message)
      }
    })

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`)
    })
  })
}

module.exports = initSocket
