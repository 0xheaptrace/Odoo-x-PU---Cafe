// Builds a Prisma-compatible date range filter from report query params
const buildDateFilter = (query) => {
  const { period, from, to } = query
  const now = new Date()

  if (from || to) {
    const filter = {}
    if (from) filter.gte = new Date(from)
    if (to) {
      const endDate = new Date(to)
      endDate.setHours(23, 59, 59, 999)
      filter.lte = endDate
    }
    return filter
  }

  if (period === 'today') {
    const start = new Date(now)
    start.setHours(0, 0, 0, 0)
    return { gte: start, lte: now }
  }

  if (period === 'week') {
    const start = new Date(now)
    start.setDate(start.getDate() - 7)
    return { gte: start, lte: now }
  }

  if (period === 'month') {
    const start = new Date(now)
    start.setMonth(start.getMonth() - 1)
    return { gte: start, lte: now }
  }

  return null
}

// Build full Prisma where clause for paid-order reports
const buildReportWhere = (query) => {
  const where = {
    OR: [
      { paymentStatus: 'paid' },
      { status: 'paid' },
    ],
  }
  const dateFilter = buildDateFilter(query)

  if (dateFilter) {
    where.createdAt = dateFilter
  }

  if (query.employeeId) {
    where.employeeId = query.employeeId
  }

  return where
}

module.exports = { buildDateFilter, buildReportWhere }
