import api from './api'

// Fetch current payment method settings (cash, card, UPI toggles)
export const getPaymentSettings = () => api.get('/payment-settings')

// Update payment method settings
export const updatePaymentSettings = (data) =>
  api.put('/payment-settings', data)
