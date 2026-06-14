import api from './api'

// Fetch all products, optionally filtered
export const getAllProducts = () => api.get('/products')

// Create a new product
export const createProduct = (data) => api.post('/products', data)

// Update an existing product by ID
export const updateProduct = (id, data) => api.put(`/products/${id}`, data)

// Delete a product by ID
export const deleteProduct = (id) => api.delete(`/products/${id}`)
