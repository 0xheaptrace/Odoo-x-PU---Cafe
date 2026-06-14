import { useContext } from 'react'
import AuthStateContext from '../context/authStateContext'

export function useAuth() {
  const context = useContext(AuthStateContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
