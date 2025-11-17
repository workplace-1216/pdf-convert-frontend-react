import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Zap, Sparkles, CheckCircle, Building, XCircle, AlertCircle, ArrowRight, MessageCircle } from 'lucide-react'
import { getRoleBasedRoute } from '../utils/roleNavigation'
import { API_URL } from '../config/api.config'
import { OTPVerification } from '../components/OTPVerification'
import { authApi } from '../services/api'
import PhoneInput from 'react-phone-input-2'
import 'react-phone-input-2/lib/style.css'
import { useTranslation } from 'react-i18next'
import LanguageSwitcher from '../components/LanguageSwitcher'

export const LoginPage: React.FC = () => {
  const { t } = useTranslation()
  const { login, register, user } = useAuth()
  const navigate = useNavigate()
  const [isLogin, setIsLogin] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    rfc: '',
    whatsappNumber: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [rfcError, setRfcError] = useState('')
  const [showPendingModal, setShowPendingModal] = useState(false)
  const [pendingCompanyName, setPendingCompanyName] = useState('')
  const [showCompanySelectionModal, setShowCompanySelectionModal] = useState(false)
  const [availableCompanies, setAvailableCompanies] = useState<Array<{ id: number; name: string; rfc: string; email: string }>>([])
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<number[]>([])
  const [companySelectionError, setCompanySelectionError] = useState('')
  const [showOTPVerification, setShowOTPVerification] = useState(false)
  const [otpEmail, setOtpEmail] = useState('')
  const [isLoginOTP, setIsLoginOTP] = useState(false)

  // Redirect if user is already logged in
  useEffect(() => {
    if (user) {
      const route = getRoleBasedRoute(user)
      navigate(route)
    }
  }, [user, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (isLogin) {
        try {
          await login({ email: formData.email, password: formData.password })
          // Navigation will be handled by useEffect when user state updates
        } catch (loginError: any) {
          // Check if it's a pending company error
          if (loginError.response?.data?.isPending) {
            setPendingCompanyName(loginError.response.data.companyName || 'su empresa')
            setShowPendingModal(true)
            setLoading(false)
            return
          }
          // Check if email needs verification (2FA)
          if (loginError.response?.data?.requiresEmailVerification) {
            setOtpEmail(loginError.response.data.email || formData.email)
            setIsLoginOTP(false)
            setShowOTPVerification(true)
            setLoading(false)
            return
          }
          // Check if login OTP is required (2FA on every login)
          if (loginError.response?.data?.requiresLoginOTP) {
            setOtpEmail(loginError.response.data.email || formData.email)
            setIsLoginOTP(true)
            setShowOTPVerification(true)
            setLoading(false)
            return
          }
          // Re-throw for normal error handling
          throw loginError
        }
      } else {
        // Validate password confirmation
        if (formData.password !== formData.confirmPassword) {
          setError('Las contraseñas no coinciden')
          setLoading(false)
          return
        }

        // Validate RFC format
        const rfcPattern = /^[A-Z]{4}[0-9]{6}[A-Z0-9]{3}$/
        if (!rfcPattern.test(formData.rfc.toUpperCase())) {
          setError('RFC inválido. Formato: 4 letras, 6 números, 3 alfanuméricos (Ej: AAAA123456ABC)')
          setLoading(false)
          return
        }

        // Fetch approved companies before registration
        try {
          const response = await fetch(`${API_URL}/companies/approved`)
          if (response.ok) {
            const companies = await response.json()
            setAvailableCompanies(companies)
            setShowCompanySelectionModal(true)
            setLoading(false)
            return
          }
        } catch (err) {
          console.error('Error fetching companies:', err)
          // Continue with registration without companies if fetch fails
        }

        // If no companies or error, proceed with registration
        await completeRegistration([])
      }
    } catch (err: any) {
      // Handle different error response formats
      let errorMessage = 'An error occurred'

      if (err.response?.data) {
        // Check if error message is directly in response data
        if (typeof err.response.data === 'string') {
          errorMessage = err.response.data
        } else if (err.response.data.message) {
          errorMessage = err.response.data.message
        } else if (err.response.data.error) {
          errorMessage = err.response.data.error
        }
      } else if (err.message) {
        errorMessage = err.message
      }

      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const completeRegistration = async (companyIds: number[]) => {
    setLoading(true)

    console.log('[Registration] Creating user with selected company IDs:', companyIds)

    try {
      // Step 1: Create user (will send OTP automatically)
      const registeredUser = await register({
        email: formData.email,
        tempPassword: formData.password,
        rfc: formData.rfc.toUpperCase(),
        whatsappNumber: formData.whatsappNumber
      })

      console.log('[Registration] User registered:', registeredUser)

      // Step 2: Check if email verification is required (2FA)
      if ((registeredUser as any).requiresEmailVerification) {
        console.log('[Registration] Email verification required, showing OTP screen')
        setOtpEmail(formData.email)
        setIsLoginOTP(false)
        setShowOTPVerification(true)
        setShowCompanySelectionModal(false)
        setLoading(false)
        // Store selected company IDs for later association after OTP verification
        setSelectedCompanyIds(companyIds)
        return
      }

      // Associate client with selected companies
      if (companyIds.length > 0) {
        // Wait a bit to ensure token is set
        await new Promise(resolve => setTimeout(resolve, 500))

        const token = localStorage.getItem('token')
        console.log('[Registration] Token available:', !!token)

        if (!token) {
          console.error('[Registration] No token found in localStorage')
          setError('Error: No se pudo autenticar. Por favor inicie sesión manualmente.')
          setLoading(false)
          return
        }

        let successCount = 0
        let failCount = 0
        const errors: string[] = []

        for (const companyId of companyIds) {
          try {
            console.log(`[Registration] Adding company ${companyId}...`)
            const response = await fetch(`${API_URL}/companies/my-companies`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ companyId })
            })

            const data = await response.json()
            console.log(`[Registration] Response for company ${companyId}:`, response.status, data)

            if (response.ok) {
              successCount++
              console.log(`[Registration] ✅ Company ${companyId} added successfully`)
            } else {
              failCount++
              const errorMsg = data.message || 'Error desconocido'
              errors.push(`Company ${companyId}: ${errorMsg}`)
              console.error(`[Registration] ❌ Failed to add company ${companyId}:`, errorMsg)
            }
          } catch (err: any) {
            failCount++
            const errorMsg = err.message || 'Error de conexión'
            errors.push(`Company ${companyId}: ${errorMsg}`)
            console.error(`[Registration] ❌ Error adding company ${companyId}:`, err)
          }
        }

        console.log(`[Registration] Company association complete: ${successCount} success, ${failCount} failed`)

        // Show error if any companies failed to associate
        if (failCount > 0) {
          console.warn('[Registration] Some companies failed to associate:', errors)
          // Don't block navigation, but log the errors
          console.warn('[Registration] User can add companies later from their profile')
        }
      }

      // Navigate to role-based page after successful registration
      setLoading(false)
      if (registeredUser.role === 'Client') {
        navigate('/client')
      } else {
        const route = getRoleBasedRoute(registeredUser)
        navigate(route)
      }
    } catch (err: any) {
      console.error('[Registration] Error:', err)
      setError(err.message || 'Error al completar el registro')
      setLoading(false)
    }
  }

  const toggleCompanySelection = (companyId: number) => {
    setSelectedCompanyIds(prev =>
      prev.includes(companyId)
        ? prev.filter(id => id !== companyId)
        : [...prev, companyId]
    )
    // Clear error when a company is selected
    setCompanySelectionError('')
  }

  const toggleMode = () => {
    setIsLogin(!isLogin)
    setFormData({
      email: '',
      password: '',
      confirmPassword: '',
      rfc: '',
      whatsappNumber: ''
    })
    setError('')
    setRfcError('')
  }

  const handleOTPVerify = async (otpCode: string) => {
    console.log('[LoginPage] handleOTPVerify called with:', { email: otpEmail, otpCode, isLoginOTP })

    if (isLoginOTP) {
      // Verify login OTP and get token
      const result = await authApi.verifyLoginOTP({ email: otpEmail, otpCode })
      console.log('[LoginPage] ✅ Login OTP verified successfully, token received')

      // Manually trigger login success by calling the login function from AuthContext
      // The token is already set by the API call
      if (result.token) {
        localStorage.setItem('token', result.token)
        // Refresh the page or navigate to trigger auth context update
        window.location.reload()
      }
    } else {
      // Verify email OTP (registration)
      const verifyResult = await authApi.verifyOTP({ email: otpEmail, otpCode })
      console.log('[LoginPage] ✅ Email OTP verified successfully:', verifyResult)

      // If token is returned (new registration), use it to associate companies
      if (verifyResult.token) {
        console.log('[LoginPage] Token received from OTP verification, logging in user')

        // Store token
        localStorage.setItem('token', verifyResult.token)

        // If there are selected companies, associate them
        if (selectedCompanyIds.length > 0) {
          console.log('[LoginPage] Associating user with companies:', selectedCompanyIds)

          // Associate with companies
          for (const companyId of selectedCompanyIds) {
            try {
              console.log(`[LoginPage] Adding company ${companyId}...`)
              const response = await fetch(`${API_URL}/companies/my-companies`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${verifyResult.token}`
                },
                body: JSON.stringify({ companyId })
              })

              if (response.ok) {
                console.log(`[LoginPage] ✅ Company ${companyId} added successfully`)
              } else {
                const error = await response.json()
                console.error(`[LoginPage] ❌ Failed to add company ${companyId}:`, error.message)
              }
            } catch (err: any) {
              console.error(`[LoginPage] ❌ Error adding company ${companyId}:`, err)
            }
          }
        }

        // Reload page to trigger auth context update
        window.location.reload()
      } else {
        // No token returned (existing user verification), show success message
        setShowOTPVerification(false)
        setError('')
        alert('Email verificado exitosamente. Por favor inicie sesión.')
        setIsLogin(true)
      }
    }
  }

  const handleOTPResend = async () => {
    await authApi.resendOTP({ email: otpEmail })
  }

  const handleOTPBack = () => {
    setShowOTPVerification(false)
    setOtpEmail('')
  }

  // Show OTP verification screen if needed
  if (showOTPVerification && otpEmail) {
    return (
      <OTPVerification
        email={otpEmail}
        userType="client"
        onVerify={handleOTPVerify}
        onResend={handleOTPResend}
        onBack={handleOTPBack}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 relative overflow-hidden flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Advanced Animated Background (disabled for white theme) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none hidden">
        {/* Floating Orbs */}
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-gradient-to-br from-blue-500/30 to-purple-500/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-gradient-to-br from-indigo-500/30 to-cyan-500/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full blur-3xl animate-pulse delay-500"></div>

        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:50px_50px] opacity-20"></div>

        {/* Animated Lines */}
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-400 to-transparent animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-purple-400 to-transparent animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 max-w-md w-full space-y-8">
        {/* Language Switcher - Top Right */}
        <div className="absolute top-0 right-0 z-20">
          <LanguageSwitcher />
        </div>

        {/* Modern Header */}
        <div className="text-center">
          <div className="relative mx-auto mb-6 group flex items-center justify-center">
            <img src="/logo.png" alt="CAAST" className="h-12 sm:h-20" />
          </div>

          <h2 className="text-3xl sm:text-4xl font-bold text-black mb-2">
            {isLogin ? t('auth.loginTitle') : t('auth.registerTitle')}
          </h2>
          <p className="text-black text-sm sm:text-base">
            {isLogin ? t('auth.loginSubtitle') : t('auth.registerSubtitle')}
          </p>
        </div>

        {/* Modern Form Card */}
        <div className="bg-white rounded-3xl shadow-2xl border border-[#64c7cd]/30 p-8 relative overflow-hidden group">
          {/* Glassmorphism Effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-3xl"></div>
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/10 via-transparent to-purple-500/10 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

          <div className="relative z-10">
            {/* Mode Toggle */}
            <div className="flex items-center justify-center mb-8">
              <div className="bg-gray-100 rounded-2xl p-1 border border-[#64c7cd]/30">
                <button
                  type="button"
                  onClick={toggleMode}
                  className={`px-6 py-3 text-sm font-medium rounded-xl transition-all duration-300 ${isLogin
                    ? 'bg-[#eb3089] text-white shadow-lg'
                    : 'text-black hover:text-black hover:bg-gray-200'
                    }`}
                >
                  Iniciar Sesión
                </button>
                <button
                  type="button"
                  onClick={toggleMode}
                  className={`px-6 py-3 text-sm font-medium rounded-xl transition-all duration-300 ${!isLogin
                    ? 'bg-[#eb3089] text-white shadow-lg'
                    : 'text-black hover:text-black hover:bg-gray-200'
                    }`}
                >
                  Registrarse
                </button>
              </div>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    <div className="text-sm text-red-700 font-medium">{error}</div>
                  </div>
                </div>
              )}

              <div className="space-y-5">
                {/* Email and RFC Fields */}
                <div className={!isLogin ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : ''}>
                  {/* Email Field */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-semibold text-black mb-2">
                      Correo electrónico
                    </label>
                    <div className="relative">
                      <input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-white border border-[#64c7cd]/30 rounded-2xl text-black placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#64c7cd] focus:border-transparent transition-all duration-300"
                        placeholder="tu@email.com"
                      />
                    </div>
                  </div>

                  {/* RFC Field (Only for Registration) */}
                  {!isLogin && (
                    <div>
                      <label htmlFor="rfc" className="block text-sm font-semibold text-black mb-2">
                        RFC
                      </label>
                      <div className="relative">
                        <input
                          id="rfc"
                          name="rfc"
                          type="text"
                          autoComplete="off"
                          required
                          maxLength={13}
                          value={formData.rfc}
                          onChange={(e) => {
                            const value = e.target.value.toUpperCase()

                            // Validate and BLOCK invalid characters based on position
                            let validValue = ''
                            let errorMsg = ''

                            // Check each character based on position
                            for (let i = 0; i < value.length; i++) {
                              const char = value[i]
                              let isValid = false

                              if (i < 4) {
                                // First 4 must be letters
                                if (/^[A-Z]$/.test(char)) {
                                  isValid = true
                                } else {
                                  errorMsg = `Posición ${i + 1}: Solo letras (A-Z)`
                                }
                              } else if (i < 10) {
                                // Next 6 must be numbers
                                if (/^[0-9]$/.test(char)) {
                                  isValid = true
                                } else {
                                  errorMsg = `Posición ${i + 1}: Solo números (0-9)`
                                }
                              } else {
                                // Last 3 can be letters or numbers
                                if (/^[A-Z0-9]$/.test(char)) {
                                  isValid = true
                                } else {
                                  errorMsg = `Posición ${i + 1}: Letras o números`
                                }
                              }

                              // Only add valid characters
                              if (isValid) {
                                validValue += char
                              } else {
                                // Stop at first invalid character and show error
                                break
                              }
                            }

                            setRfcError(errorMsg)
                            setFormData(prev => ({ ...prev, rfc: validValue }))
                          }}
                          className={`w-full px-4 py-3 bg-white border rounded-2xl text-black placeholder-slate-400 focus:outline-none focus:ring-2 transition-all duration-300 uppercase ${formData.rfc && /^[A-Z]{4}[0-9]{6}[A-Z0-9]{3}$/.test(formData.rfc)
                              ? 'border-[#a5cc55] focus:ring-[#a5cc55]'
                              : rfcError
                                ? 'border-red-400 focus:ring-red-400'
                                : formData.rfc.length > 0
                                  ? 'border-yellow-300 focus:ring-yellow-400'
                                  : 'border-[#64c7cd]/30 focus:ring-[#64c7cd]'
                            }`}
                          placeholder="AAAA123456ABC"
                        />

                        {/* Error Tooltip */}
                        {rfcError && (
                          <div className="absolute z-10 -bottom-2 left-0 transform translate-y-full mt-1">
                            <div className="bg-red-500 text-white text-xs rounded-lg py-2 px-3 shadow-lg relative animate-pulse">
                              <div className="absolute -top-1 left-4 w-2 h-2 bg-red-500 transform rotate-45"></div>
                              {rfcError}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Position Guide */}
                      {formData.rfc.length > 0 && formData.rfc.length < 13 && !rfcError && (
                        <div className="mt-2 text-xs text-blue-600">
                          {formData.rfc.length < 4 && (
                            <span>✏️ Ingresa {4 - formData.rfc.length} letra(s) más</span>
                          )}
                          {formData.rfc.length >= 4 && formData.rfc.length < 10 && (
                            <span>🔢 Ingresa {10 - formData.rfc.length} número(s) más</span>
                          )}
                          {formData.rfc.length >= 10 && formData.rfc.length < 13 && (
                            <span>📝 Ingresa {13 - formData.rfc.length} carácter(es) más (letra o número)</span>
                          )}
                        </div>
                      )}

                      {formData.rfc && /^[A-Z]{4}[0-9]{6}[A-Z0-9]{3}$/.test(formData.rfc) && (
                        <div className="mt-2 flex items-center space-x-2 text-green-600">
                          <CheckCircle className="h-4 w-4" />
                          <p className="text-sm">RFC válido ✓</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* WhatsApp Number (Only for Registration) */}
                {!isLogin && (
                  <div>
                    <label htmlFor="whatsappNumber" className="block text-sm font-semibold text-black mb-2">
                      WhatsApp (Opcional)
                    </label>
                    <div className="relative">
                      <MessageCircle className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#25D366] z-10" />
                      <PhoneInput
                        country={'mx'}
                        value={formData.whatsappNumber}
                        onChange={(phone) => setFormData(prev => ({ ...prev, whatsappNumber: phone }))}
                        inputProps={{
                          name: 'whatsappNumber',
                          id: 'whatsappNumber',
                          required: false,
                          className: 'w-full pr-4 py-3 bg-white border border-[#64c7cd]/30 rounded-2xl text-black placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#64c7cd] focus:border-transparent transition-all duration-300',
                          style: { paddingLeft: '90px' }
                        }}
                        containerClass="w-full"
                        buttonClass="!bg-transparent !border-0 !absolute !left-12"
                        dropdownClass="!bg-white !border-2 !border-gray-200 !rounded-xl !shadow-lg"
                        searchClass="!bg-white !border-gray-200 !rounded-lg"
                        enableSearch
                        searchPlaceholder="Buscar país"
                        placeholder="Número con código de país"
                        countryCodeEditable={true}
                      />
                    </div>
                  </div>
                )}

                {/* Password and Confirm Password Fields */}
                <div className={!isLogin ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : ''}>
                  {/* Password Field */}
                  <div>
                    <label htmlFor="password" className="block text-sm font-semibold text-black mb-2">
                      Contraseña
                    </label>
                    <div className="relative">
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete={isLogin ? 'current-password' : 'new-password'}
                        required
                        value={formData.password}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-white border border-[#64c7cd]/30 rounded-2xl text-black placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#64c7cd] focus:border-transparent transition-all duration-300 pr-12"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-black hover:text-black transition-colors duration-200"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password Field */}
                  {!isLogin && (
                    <div>
                      <label htmlFor="confirmPassword" className="block text-sm font-semibold text-black mb-2">
                        Confirmar contraseña
                      </label>
                      <div className="relative">
                        <input
                          id="confirmPassword"
                          name="confirmPassword"
                          type={showConfirmPassword ? 'text' : 'password'}
                          autoComplete="new-password"
                          required
                          value={formData.confirmPassword}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-3 bg-white border rounded-2xl text-black placeholder-slate-400 focus:outline-none focus:ring-2 transition-all duration-300 pr-12 ${formData.confirmPassword && formData.password !== formData.confirmPassword
                            ? 'border-red-300 focus:ring-red-400'
                            : formData.confirmPassword && formData.password === formData.confirmPassword
                              ? 'border-[#a5cc55] focus:ring-[#a5cc55]'
                              : 'border-[#64c7cd]/30 focus:ring-[#64c7cd]'
                            }`}
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-black hover:text-black transition-colors duration-200"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                      {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                        <div className="mt-2 flex items-center space-x-2 text-red-600">
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                          <p className="text-sm">Las contraseñas no coinciden</p>
                        </div>
                      )}
                      {formData.confirmPassword && formData.password === formData.confirmPassword && (
                        <div className="mt-2 flex items-center space-x-2 text-green-600">
                          <CheckCircle className="h-4 w-4" />
                          <p className="text-sm">Las contraseñas coinciden</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-6 py-4 bg-[#eb3089] text-white font-semibold rounded-2xl shadow-2xl hover:bg-[#eb3089]/80 focus:outline-none focus:ring-2 focus:ring-[#64c7cd] transition-all duration-300 hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative flex items-center justify-center space-x-2">
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                        <span>Procesando...</span>
                      </>
                    ) : (
                      <>
                        {isLogin ? (
                          <>
                            <Zap className="h-5 w-5" />
                            <span>Iniciar Sesión</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-5 w-5" />
                            <span>Crear Cuenta</span>
                          </>
                        )}
                      </>
                    )}
                  </div>
                </button>
              </div>

              {/* Register Company Button */}
              {!isLogin && (
                <div className="pt-3">
                  <button
                    type="button"
                    onClick={() => navigate('/register-company')}
                    className="w-full px-6 py-3 bg-white text-[#eb3089] font-semibold rounded-2xl shadow-xl border-2 border-[#eb3089] hover:bg-[#eb3089]/50 hover:text-black focus:outline-none focus:ring-2 focus:ring-[#64c7cd] transition-all duration-300 hover:scale-[1.01] relative overflow-hidden group"
                  >
                    <div className="relative flex items-center justify-center space-x-2">
                      <Building className="h-5 w-5" />
                      <span>Registrar Empresa</span>
                    </div>
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
        
      </div>

      {/* Company Selection Modal */}
      {showCompanySelectionModal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-[#64c7cd]/30 w-full max-w-2xl p-6 relative max-h-[80vh] overflow-y-auto">
            <button
              onClick={() => {
                setShowCompanySelectionModal(false)
                setSelectedCompanyIds([])
                setCompanySelectionError('')
                setLoading(false)
              }}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              <XCircle className="h-5 w-5 text-black" />
            </button>

            <div className="mb-6">
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-2 bg-[#eb3089] rounded-xl">
                  <Building className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-black">Seleccionar Empresas</h3>
              </div>
              <p className="text-sm text-black/60">
                Seleccione al menos una empresa con la que trabajará (requerido)
              </p>
              {selectedCompanyIds.length > 0 && (
                <p className="text-sm text-[#eb3089] font-medium mt-2">
                  {selectedCompanyIds.length} empresa(s) seleccionada(s)
                </p>
              )}
            </div>

            {companySelectionError && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-4">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <div className="text-sm text-red-700 font-medium">{companySelectionError}</div>
                </div>
              </div>
            )}

            {availableCompanies.length === 0 ? (
              <div className="text-center py-8">
                <Building className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-black/60">No hay empresas disponibles</p>
                <p className="text-xs text-black/40 mt-1">No puede registrarse sin empresas aprobadas</p>
              </div>
            ) : (
              <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
                {availableCompanies.map((company) => (
                  <button
                    key={company.id}
                    onClick={() => toggleCompanySelection(company.id)}
                    className={`w-full p-4 rounded-xl border-2 transition-all duration-200 text-left ${selectedCompanyIds.includes(company.id)
                        ? 'border-[#eb3089] bg-[#eb3089]/10'
                        : 'border-gray-200 hover:border-[#eb3089]/50 hover:bg-gray-50'
                      }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${selectedCompanyIds.includes(company.id) ? 'bg-[#eb3089]' : 'bg-gray-300'
                          }`}>
                          <Building className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-black">{company.name}</p>
                          <p className="text-xs text-black/60">RFC: {company.rfc}</p>
                          <p className="text-xs text-black/60">{company.email}</p>
                        </div>
                      </div>
                      {selectedCompanyIds.includes(company.id) && (
                        <div className="flex-shrink-0">
                          <CheckCircle className="h-6 w-6 text-[#eb3089]" />
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}

            <div className="flex items-center space-x-3">
              <button
                onClick={() => {
                  setShowCompanySelectionModal(false)
                  setSelectedCompanyIds([])
                  setCompanySelectionError('')
                  setLoading(false)
                }}
                className="flex-1 px-4 py-3 text-sm font-medium text-black bg-white border border-gray-300 rounded-xl hover:bg-gray-100 transition-all duration-300"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (selectedCompanyIds.length === 0) {
                    setCompanySelectionError('Debe seleccionar al menos una empresa para continuar')
                    return
                  }
                  setCompanySelectionError('')
                  setShowCompanySelectionModal(false)
                  completeRegistration(selectedCompanyIds)
                }}
                className="flex-1 px-4 py-3 text-sm font-medium text-white bg-[#eb3089] rounded-xl hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center justify-center space-x-2"
              >
                <span>Continuar</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pending Company Modal */}
      {showPendingModal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowPendingModal(false)
            }
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-[#eb3089]/30 w-full max-w-md p-6 relative">
            <button
              onClick={() => setShowPendingModal(false)}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              <XCircle className="h-5 w-5 text-black" />
            </button>

            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="h-8 w-8 text-yellow-600" />
              </div>

              <h3 className="text-xl font-bold text-black mb-2">Aprobación Pendiente</h3>

              <div className="mb-6 text-sm text-black/70">
                <p className="mb-3">
                  La empresa <span className="font-semibold text-black">"{pendingCompanyName}"</span> está registrada pero aún no ha sido aprobada por un administrador.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-left">
                  <p className="font-semibold text-blue-900 mb-2">¿Qué hacer ahora?</p>
                  <ul className="space-y-2 text-blue-800">
                    <li className="flex items-start space-x-2">
                      <span className="text-blue-600 mt-0.5">•</span>
                      <span>Espere a que un administrador revise su solicitud</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-blue-600 mt-0.5">•</span>
                      <span>Recibirá una notificación cuando sea aprobada</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-blue-600 mt-0.5">•</span>
                      <span>Podrá iniciar sesión después de la aprobación</span>
                    </li>
                  </ul>
                </div>
              </div>

              <button
                onClick={() => setShowPendingModal(false)}
                className="w-full px-6 py-3 bg-[#eb3089] text-white font-semibold rounded-xl hover:bg-[#eb3089]/80 transition-all duration-300 hover:scale-105 shadow-lg"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}