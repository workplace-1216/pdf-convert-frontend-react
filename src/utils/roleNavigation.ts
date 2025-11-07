import { User } from '../types/api'

/**
 * Determines the appropriate route for a user based on their role
 */
export const getRoleBasedRoute = (user: User | null): string => {
  if (!user) {
    return '/login'
  }

  switch (user.role) {
    case 'Admin':
      return '/admin' // Admin dashboard
    case 'Client':
      return '/client' // Client dashboard
    case 'Company':
      return '/company' // Company dashboard
    default:
      return '/client' // Default to client dashboard
  }
}

/**
 * Gets the display name for a role
 */
export const getRoleDisplayName = (role: string): string => {
  switch (role) {
    case 'Admin':
      return 'Administrator'
    case 'Client':
      return 'Client'
    case 'Company':
      return 'Company'
    default:
      return 'User'
  }
}
