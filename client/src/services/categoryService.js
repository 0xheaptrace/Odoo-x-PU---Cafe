import api from './api'

// Fetch all product categories
export const getAllCategories = () => api.get('/categories')

// Create a new product category
export const createCategory = (data) => api.post('/categories', data)

// Update an existing category by ID
export const updateCategory = (id, data) => api.put(`/categories/${id}`, data)

// Delete a category by ID
export const deleteCategory = (id) => api.delete(`/categories/${id}`)
