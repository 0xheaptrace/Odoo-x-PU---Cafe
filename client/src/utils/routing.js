import { ROLES } from '../constants'

export const ROLE_ACCESS = {
  admin: [ROLES.ADMIN],
  staff: [ROLES.ADMIN, ROLES.EMPLOYEE],
  customer: [ROLES.CUSTOMER],
}

export function getHomeRoute(role) {
  if (role === ROLES.ADMIN) return '/admin/dashboard'
  if (role === ROLES.EMPLOYEE) return '/pos'
  if (role === ROLES.CUSTOMER) return '/customer/home'
  return '/login'
}

export function getStoredSession() {
  const token = localStorage.getItem('token')
  const storedUser = localStorage.getItem('user')

  if (!token || !storedUser) {
    return { token: null, user: null }
  }

  try {
    const user = JSON.parse(storedUser)
    if (!Object.values(ROLES).includes(user?.role)) {
      return { token: null, user: null }
    }
    return { token, user }
  } catch {
    return { token: null, user: null }
  }
}
