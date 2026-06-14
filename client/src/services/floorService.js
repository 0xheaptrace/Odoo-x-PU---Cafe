import api from './api'

// Fetch all floors with their tables
export const getAllFloors = () => api.get('/floors')

// Create a new floor
export const createFloor = (data) => api.post('/floors', data)

// Add a table to a specific floor
export const addTable = (floorId, data) =>
  api.post(`/floors/${floorId}/tables`, data)

// Update table details by table ID
export const updateTable = (id, data) => api.put(`/tables/${id}`, data)

// Delete a table by ID
export const deleteTable = (id) => api.delete(`/tables/${id}`)
