import api from './api'

const normalizeCustomer = (data) => ({
  name: data.name?.trim() || '',
  email: data.email?.trim() || null,
  phone: data.phone?.trim() || null,
})

// Fetch all customers, optionally filtered by search term
export const getAllCustomers = (search) =>
  api.get('/customers', { params: { search } })

// Create a new customer record
export const createCustomer = (data) => api.post('/customers', normalizeCustomer(data))

// Update an existing customer by ID
export const updateCustomer = (id, data) => api.put(`/customers/${id}`, normalizeCustomer(data))

// Delete a customer by ID
export const deleteCustomer = (id) => api.delete(`/customers/${id}`)
