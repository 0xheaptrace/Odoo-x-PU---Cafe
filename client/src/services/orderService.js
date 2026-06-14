import api from './api'

// Fetch all orders with optional filters (status, date range, etc.)
export const getAllOrders = (filters) =>
  api.get('/orders', { params: filters })

// Create a new order
export const createOrder = (data) => api.post('/orders', data)

// Update an existing order by ID
export const updateOrder = (id, data) => api.put(`/orders/${id}`, data)

// Delete an order by ID
export const deleteOrder = (id) => api.delete(`/orders/${id}`)

// Send an order to the kitchen for preparation
export const sendToKitchen = (id) => api.post(`/orders/${id}/kitchen`)

// Process payment for an order
export const processPayment = (id, data) =>
  api.post(`/orders/${id}/payment`, data)

// Update operational order status
export const updateOrderStatus = (id, data) =>
  api.patch(`/orders/${id}/status`, data)

// Email a receipt for a completed order
export const sendReceipt = (id, email) =>
  api.post(`/orders/${id}/receipt`, { email })
