import api from './api'

// Get summary statistics (revenue, orders, etc.) for a date range
export const getSummary = (filters) =>
  api.get('/reports/summary', { params: filters })

// Get sales trend data over time for charts
export const getSalesTrend = (filters) =>
  api.get('/reports/sales-trend', { params: filters })

// Get top-selling products for a date range
export const getTopProducts = (filters) =>
  api.get('/reports/top-products', { params: filters })

// Get top-performing categories for a date range
export const getTopCategories = (filters) =>
  api.get('/reports/top-categories', { params: filters })

// Get highest-value orders for a date range
export const getTopOrders = (filters) =>
  api.get('/reports/top-orders', { params: filters })

// Get peak order hours for a date range
export const getPeakHours = (filters) =>
  api.get('/reports/peak-hours', { params: filters })

// Get revenue breakdown per table for a date range
export const getRevenuePerTable = (filters) =>
  api.get('/reports/revenue-per-table', { params: filters })
