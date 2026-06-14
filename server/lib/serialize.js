// Serializes Prisma results to Mongoose-compatible JSON (_id, relation shapes)
const FK_FIELDS = {
  categoryId: 'category',
  floorId: 'floor',
  tableId: 'table',
  customerId: 'customer',
  employeeId: 'employee',
  sessionId: 'session',
  openedById: 'openedBy',
  productId: 'product',
}

const ENUM_TO_API = {
  to_cook: 'to-cook',
}

const ENUM_FROM_API = {
  'to-cook': 'to_cook',
}

const ORDER_STATUS_FROM_API = {
  draft: 'pending',
  paid: 'completed',
}

// Convert Prisma Decimal and enum values for API output
const normalizeValue = (key, value) => {
  if (value === null || value === undefined) return value
  if (value instanceof Date) return value
  if (typeof value === 'object' && typeof value.toNumber === 'function') {
    return value.toNumber()
  }
  if (typeof value === 'string' && ENUM_TO_API[value]) {
    return ENUM_TO_API[value]
  }
  return value
}

// Recursively convert Prisma documents to Mongoose-style responses
const serializeDoc = (obj) => {
  if (obj === null || obj === undefined) return obj
  if (obj instanceof Date) return obj
  if (typeof obj !== 'object') return obj
  if (Array.isArray(obj)) return obj.map(serializeDoc)

  const result = {}
  const relationKeys = new Set()

  for (const [key, value] of Object.entries(obj)) {
    if (FK_FIELDS[key] && obj[FK_FIELDS[key]] && typeof obj[FK_FIELDS[key]] === 'object') {
      relationKeys.add(key)
    }
  }

  for (const [key, value] of Object.entries(obj)) {
    if (key === 'id') {
      result._id = value
      continue
    }

    if (relationKeys.has(key)) continue

    if (FK_FIELDS[key]) {
      const relationKey = FK_FIELDS[key]
      if (obj[relationKey] && typeof obj[relationKey] === 'object') {
        result[relationKey] = serializeDoc(obj[relationKey])
      } else if (value) {
        result[relationKey] = value
      }
      continue
    }

    result[key] = serializeDoc(normalizeValue(key, value))
  }

  return result
}

// Map API kitchen status strings to Prisma enum values
const mapKitchenStatusFromApi = (status) => {
  if (!status) return 'pending'
  return ENUM_FROM_API[status] || status
}

const mapOrderStatusFromApi = (status) => {
  if (!status) return undefined
  return ORDER_STATUS_FROM_API[status] || status
}

// Map order item input from request body to Prisma create shape
const getInputId = (value) => {
  if (value === null || value === undefined || value === '') return value
  if (typeof value === 'object') return value.id || value._id
  return value
}

const mapOrderItemInput = (item) => ({
  productId: getInputId(item.product ?? item.productId),
  name: item.name,
  quantity: item.quantity,
  unitPrice: item.unitPrice,
  lineTotal: item.lineTotal,
  notes: item.notes,
  sentToKitchen: item.sentToKitchen ?? false,
  kitchenStatus: mapKitchenStatusFromApi(item.kitchenStatus),
})

// Standard include for order queries with populated relations
const orderInclude = {
  table: true,
  customer: true,
  employee: { select: { id: true, name: true, email: true } },
  items: true,
}

module.exports = {
  serializeDoc,
  mapKitchenStatusFromApi,
  mapOrderStatusFromApi,
  mapOrderItemInput,
  orderInclude,
}
