import api from './api'

// Authenticate user with email and password, returns token and user data
export const login = (email, password) =>
  api.post('/auth/login', { email, password })

// Register a new customer account
export const signup = (name, email, password) =>
  api.post('/auth/signup', { name, email, password })

// Check if initial admin setup is required
export const getSetupStatus = () => api.get('/auth/setup-status')

// Create the first admin account (one-time setup)
export const setupAdmin = (name, email, password) =>
  api.post('/auth/setup-admin', { name, email, password })
