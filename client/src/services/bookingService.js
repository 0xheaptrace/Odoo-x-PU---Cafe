import api from './api'

const normalizeBooking = (data) => ({
  customer: data.customer?._id || data.customer?.id || data.customer,
  table: data.table?._id || data.table?.id || data.table,
  floor: data.floor?._id || data.floor?.id || data.floor,
  date: data.date,
  time: data.time,
  numberOfGuests: Number.parseInt(data.numberOfGuests, 10),
  status: data.status,
})

// Fetch all table bookings
export const getAllBookings = (filters) => api.get('/bookings', { params: filters })

// Create a new table booking
export const createBooking = (data) => api.post('/bookings', normalizeBooking(data))

// Update an existing booking by ID
export const updateBooking = (id, data) => api.put(`/bookings/${id}`, normalizeBooking(data))
