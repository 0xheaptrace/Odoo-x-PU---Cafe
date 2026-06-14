// Shared helpers for IDs, formatting, and API response normalization
export const getId = (obj) => obj?._id || obj?.id || obj

export const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0)

export const formatDate = (date) => {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export const formatDateTime = (date) => {
  if (!date) return '—'
  return new Date(date).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export const getCategoryId = (product) =>
  getId(product.category) || product.categoryId || product.category

export const paginate = (items, page, perPage) => {
  const start = (page - 1) * perPage
  return items.slice(start, start + perPage)
}

export const DEMO_SUMMARY = {
  totalOrders: 128,
  totalRevenue: 4850,
  avgOrderValue: 37.89,
}

export const DEMO_SALES_TREND = [
  { date: '2026-06-07', orders: 12, revenue: 420 },
  { date: '2026-06-08', orders: 18, revenue: 610 },
  { date: '2026-06-09', orders: 15, revenue: 520 },
  { date: '2026-06-10', orders: 22, revenue: 780 },
  { date: '2026-06-11', orders: 19, revenue: 690 },
  { date: '2026-06-12', orders: 25, revenue: 920 },
  { date: '2026-06-13', orders: 17, revenue: 610 },
]
