import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { User, LoginRequest, RegisterRequest } from '../types/api'
import { authApi } from '../services/api'

interface AuthContextType {
  user: User | null
  token: string | null
  login: (credentials: LoginRequest) => Promise<void>
  register: (userData: RegisterRequest) => Promise<User>
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const storedToken = localStorage.getItem('token')
    if (storedToken) {
      setToken(storedToken)
      // Verify token and get user info
      authApi.getCurrentUser()
        .then(userData => {
          setUser(userData)
        })
        .catch((error) => {
          console.warn('Token validation failed:', error)
          // Only clear token if it's a 401 error (invalid token)
          if (error.response?.status === 401) {
            localStorage.removeItem('token')
            setToken(null)
          }
        })
        .finally(() => {
          setLoading(false)
        })
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (credentials: LoginRequest) => {
    try {
      const response = await authApi.login(credentials)

      // Set token immediately
      setToken(response.token)
      localStorage.setItem('token', response.token)

          // Create a user object from the response
          const user: User = {
            id: 0, // We'll get this from /auth/me
            email: credentials.email,
            role: response.role as 'Admin' | 'Client' | 'Company',
            createdAt: new Date().toISOString()
          }
      setUser(user)

      // Try to get full user details, but don't fail if it doesn't work
      try {
        const fullUser = await authApi.getCurrentUser()
        setUser(fullUser)
      } catch (err) {
        // If we can't get full user details, keep the basic user object
        console.warn('Could not fetch full user details:', err)
        // Don't throw the error, just keep the basic user info
      }
    } catch (error: any) {
      // Log the full error for debugging
      console.log('[AuthContext] Login error:', error)
      console.log('[AuthContext] Error response:', error.response)
      console.log('[AuthContext] Error response data:', error.response?.data)

      // Re-throw to let the caller handle it (like LoginPage checking for requiresLoginOTP)
      throw error
    }
  }

  const register = async (userData: RegisterRequest): Promise<any> => {
    try {
      const response = await authApi.registerVendor(userData)

      // If email verification is required, do NOT auto-login or set user state
      if (response.requiresEmailVerification) {
        console.log('[AuthContext] Email verification required, skipping auto-login')
        // Return the response so LoginPage can handle OTP verification
        return response
      }

      // Only auto-login if email verification is NOT required (legacy flow)
      // Convert RegisterVendorResponse to User format
      const user: User = {
        id: response.userId,
        email: response.email,
        role: response.role as 'Admin' | 'Client' | 'Company'
      }
      setUser(user)

      // Auto-login after registration
      const loginResponse = await authApi.login({
        email: userData.email,
        password: userData.tempPassword
      })
      setToken(loginResponse.token)
      localStorage.setItem('token', loginResponse.token)

      // Skip getCurrentUser call to avoid timing issues
      // The user data we have from registration is sufficient
      return user
    } catch (error) {
      throw error
    }
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('token')
  }

  const value = {
    user,
    token,
    login,
    register,
    logout,
    loading
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}