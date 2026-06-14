// Order helpers — order number generation and body mapping
const prisma = require('../lib/prisma')
const { mapOrderItemInput, mapOrderStatusFromApi } = require('../lib/serialize')
const { getId, pickDefined } = require('./requestMapping')

const generateOrderNumber = async () => {
  return `ORD-${Date.now()}`
}

// Map Mongoose-style order request body to Prisma create/update data
const mapOrderBody = (body) => {
  const data = pickDefined(body, [
    'subtotal',
    'taxAmount',
    'discountAmount',
    'couponCode',
    'total',
    'paymentMethod',
    'cashReceived',
    'changeGiven',
    'cardTransactionRef',
    'paymentStatus',
    'receiptEmailSent',
  ])

  if (body.status !== undefined || body.orderStatus !== undefined) {
    data.status = mapOrderStatusFromApi(body.orderStatus ?? body.status)
  }

  const table = body.table ?? body.tableId
  const customer = body.customer ?? body.customerId
  const employee = body.employee ?? body.employeeId
  const session = body.session ?? body.sessionId

  if (table !== undefined) data.tableId = getId(table) || null
  if (customer !== undefined) data.customerId = getId(customer) || null
  if (employee !== undefined) data.employeeId = getId(employee)
  if (session !== undefined) data.sessionId = getId(session) || null

  if (body.items) {
    data.items = {
      create: body.items.map(mapOrderItemInput),
    }
  }

  return data
}

// Map order body for updates (replaces items when provided)
const mapOrderUpdateBody = (body) => {
  const data = mapOrderBody(body)
  if (data.items) {
    data.items = {
      deleteMany: {},
      create: body.items.map(mapOrderItemInput),
    }
  }
  return data
}

module.exports = { generateOrderNumber, mapOrderBody, mapOrderUpdateBody }
