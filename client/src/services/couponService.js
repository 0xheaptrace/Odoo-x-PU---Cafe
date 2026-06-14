import api from './api'

// Fetch all discount coupons
export const getAllCoupons = () => api.get('/coupons')

// Create a new coupon
export const createCoupon = (data) => api.post('/coupons', data)

// Update an existing coupon by ID
export const updateCoupon = (id, data) => api.put(`/coupons/${id}`, data)

// Delete a coupon by ID
export const deleteCoupon = (id) => api.delete(`/coupons/${id}`)

// Validate a coupon code and return discount details
export const validateCoupon = (code) => api.post('/coupons/validate', { code })
