import { useState, useCallback } from 'react'
import * as authService from '../services/authService'
import { getStoredSession } from '../utils/routing'
import AuthStateContext from './authStateContext'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getStoredSession().user)

  const login = useCallback(async (email, password) => {
    const { data } = await authService.login(email, password)
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(data.user))
    setUser(data.user)
    return data.user
  }, [])

  const signup = useCallback(async (name, email, password) => {
    const { data } = await authService.signup(name, email, password)
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(data.user))
    setUser(data.user)
    return data.user
  }, [])

  const setupAdmin = useCallback(async (name, email, password) => {
    const { data } = await authService.setupAdmin(name, email, password)
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(data.user))
    setUser(data.user)
    return data.user
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }, [])

  const isAuthenticated = Boolean(user && localStorage.getItem('token'))

  return (
    <AuthStateContext.Provider
      value={{ user, login, signup, setupAdmin, logout, isAuthenticated }}
    >
      {children}
    </AuthStateContext.Provider>
  )
}
