import api from './api'

// Get the currently open POS session
export const getCurrentSession = () => api.get('/sessions/current')

// Open a new POS session
export const openSession = () => api.post('/sessions/open')

// Close the current POS session
export const closeSession = () => api.post('/sessions/close')
