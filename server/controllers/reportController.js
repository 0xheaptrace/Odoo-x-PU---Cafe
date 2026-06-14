// Report controller — analytics and dashboard data
const prisma = require('../lib/prisma')
const { buildReportWhere } = require('../utils/dateFilter')
const { serializeDoc } = require('../lib/serialize')

// Summary stats — total orders, revenue, average order value
const getSummary = async (req, res) => {
  try {
    const where = buildReportWhere(req.query)

    const result = await prisma.order.aggregate({
      where,
      _count: { id: true },
      _sum: { total: true },
      _avg: { total: true },
    })

    res.status(200).json({
      totalOrders: result._count.id,
      totalRevenue: result._sum.total || 0,
      avgOrderValue: result._avg.total || 0,
    })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// Sales trend grouped by day for charts
const getSalesTrend = async (req, res) => {
  try {
    const where = buildReportWhere(req.query)
    const orders = await prisma.order.findMany({
      where,
      select: { createdAt: true, total: true },
      orderBy: { createdAt: 'asc' },
    })

    const trendMap = {}
    for (const order of orders) {
      const date = order.createdAt.toISOString().split('T')[0]
      if (!trendMap[date]) trendMap[date] = { date, orders: 0, revenue: 0 }
      trendMap[date].orders += 1
      trendMap[date].revenue += order.total
    }

    res.status(200).json(Object.values(trendMap))
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// Top 5 products by quantity sold
const getTopProducts = async (req, res) => {
  try {
    const where = buildReportWhere(req.query)
    const orders = await prisma.order.findMany({
      where,
      include: { items: true },
    })

    const productMap = {}
    for (const order of orders) {
      for (const item of order.items) {
        const key = item.productId
        if (!productMap[key]) {
          productMap[key] = {
            _id: item.productId,
            name: item.name,
            totalQuantity: 0,
            totalRevenue: 0,
          }
        }
        productMap[key].totalQuantity += item.quantity
        productMap[key].totalRevenue += item.lineTotal
      }
    }

    const topProducts = Object.values(productMap)
      .sort((a, b) => b.totalQuantity - a.totalQuantity)
      .slice(0, 5)

    res.status(200).json(topProducts)
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// Top 5 categories by revenue
const getTopCategories = async (req, res) => {
  try {
    const where = buildReportWhere(req.query)
    const orders = await prisma.order.findMany({
      where,
      include: {
        items: {
          include: {
            product: { include: { category: true } },
          },
        },
      },
    })

    const categoryMap = {}
    for (const order of orders) {
      for (const item of order.items) {
        const category = item.product?.category
        if (!category) continue

        if (!categoryMap[category.id]) {
          categoryMap[category.id] = {
            _id: category.id,
            name: category.name,
            totalRevenue: 0,
          }
        }
        categoryMap[category.id].totalRevenue += item.lineTotal
      }
    }

    const topCategories = Object.values(categoryMap)
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 5)

    res.status(200).json(topCategories)
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// Highest value orders
const getTopOrders = async (req, res) => {
  try {
    const where = buildReportWhere(req.query)

    const topOrders = await prisma.order.findMany({
      where,
      orderBy: { total: 'desc' },
      take: 5,
      include: {
        table: true,
        employee: { select: { id: true, name: true } },
      },
    })

    res.status(200).json(topOrders.map(serializeDoc))
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// Orders grouped by hour of day
const getPeakHours = async (req, res) => {
  try {
    const where = buildReportWhere(req.query)
    const orders = await prisma.order.findMany({
      where,
      select: { createdAt: true, total: true },
    })

    const hourMap = {}
    for (const order of orders) {
      const hour = order.createdAt.getHours()
      if (!hourMap[hour]) hourMap[hour] = { hour, orders: 0, revenue: 0 }
      hourMap[hour].orders += 1
      hourMap[hour].revenue += order.total
    }

    const peakHours = Object.values(hourMap).sort((a, b) => a.hour - b.hour)
    res.status(200).json(peakHours)
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// Revenue breakdown per table
const getRevenuePerTable = async (req, res) => {
  try {
    const where = buildReportWhere(req.query)
    where.tableId = { not: null }

    const orders = await prisma.order.findMany({
      where,
      include: { table: true },
    })

    const tableMap = {}
    for (const order of orders) {
      const key = order.tableId
      if (!tableMap[key]) {
        tableMap[key] = {
          tableNumber: order.table?.tableNumber,
          totalOrders: 0,
          totalRevenue: 0,
        }
      }
      tableMap[key].totalOrders += 1
      tableMap[key].totalRevenue += order.total
    }

    const revenuePerTable = Object.values(tableMap).sort(
      (a, b) => b.totalRevenue - a.totalRevenue,
    )

    res.status(200).json(revenuePerTable)
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

module.exports = {
  getSummary,
  getSalesTrend,
  getTopProducts,
  getTopCategories,
  getTopOrders,
  getPeakHours,
  getRevenuePerTable,
}
