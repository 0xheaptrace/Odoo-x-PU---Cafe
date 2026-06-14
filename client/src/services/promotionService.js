import api from './api'

// Fetch all active promotions
export const getAllPromotions = () => api.get('/promotions')

// Create a new promotion
export const createPromotion = (data) => api.post('/promotions', data)

// Update an existing promotion by ID
export const updatePromotion = (id, data) => api.put(`/promotions/${id}`, data)

// Delete a promotion by ID
export const deletePromotion = (id) => api.delete(`/promotions/${id}`)
