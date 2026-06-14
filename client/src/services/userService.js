import api from './api'

// Fetch all users from the system
export const getAllUsers = () => api.get('/users')

// Create a new user with the provided data
export const createUser = (data) => api.post('/users', data)

// Change password for a specific user by ID
export const changePassword = (id, password) =>
  api.patch(`/users/${id}/password`, { password })

// Archive (soft-delete) a user by ID
export const archiveUser = (id) => api.patch(`/users/${id}/archive`)

// Permanently delete a user by ID
export const deleteUser = (id) => api.delete(`/users/${id}`)
