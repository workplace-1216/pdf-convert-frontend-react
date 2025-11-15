import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building, ArrowLeft, CheckCircle, AlertCircle, Mail, FileText, Eye, EyeOff, XCircle, MessageCircle } from 'lucide-react'
import { API_URL } from '../config/api.config'
import { OTPVerification } from '../components/OTPVerification'
import { companyApi } from '../services/api'
import PhoneInput from 'react-phone-input-2'
import 'react-phone-input-2/lib/style.css'

export const CompanyRegistrationPage: React.FC = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    name: '',
    rfc: '',
    email: '',
    whatsappNumber: '',
    password: '',
    confirmPassword: ''
  })
  const [loading, setLoading] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [error, setError] = useState('')
  const [rfcError, setRfcError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [showOTPVerification, setShowOTPVerification] = useState(false)
  const [otpEmail, setOtpEmail] = useState('')

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'rfc' ? value.toUpperCase() : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Validate required fields
    if (!formData.name || !formData.rfc || !formData.email || !formData.whatsappNumber || !formData.password || !formData.confirmPassword) {
      setError('Por favor complete todos los campos requeridos')
      setLoading(false)
      return
    }

    // Validate RFC format
    if (formData.rfc.length !== 13) {
      setError('El RFC debe tener 13 caracteres')
      setLoading(false)
      return
    }

    // Validate email format
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailPattern.test(formData.email)) {
      setError('Email inválido')
      setLoading(false)
      return
    }

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden')
      setLoading(false)
      return
    }

    // Validate password length
    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      setLoading(false)
      return
    }

    try {
      const response = await fetch(`${API_URL}/companies/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (response.ok) {
        // Check if email verification is required (2FA)
        if (data.requiresEmailVerification) {
          setOtpEmail(formData.email)
          setShowOTPVerification(true)
        } else {
          // Old flow (no 2FA)
          setShowSuccessModal(true)
        }
        // Reset form
        setFormData({
          name: '',
          rfc: '',
          email: '',
          whatsappNumber: '',
          password: '',
          confirmPassword: ''
        })
      } else {
        setError(data.message || 'Error al registrar la empresa')
      }
    } catch (err: any) {
      setError('Error de conexión. Por favor intente nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleOTPVerify = async (otpCode: string) => {
    await companyApi.verifyOTP({ email: otpEmail, otpCode })
  }

  const handleOTPResend = async () => {
    await companyApi.resendOTP({ email: otpEmail })
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
        userType="company"
        onVerify={handleOTPVerify}
        onResend={handleOTPResend}
        onBack={handleOTPBack}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Back Button */}
        <button
          onClick={() => navigate('/login')}
          className="mb-10 flex items-center space-x-2 text-black hover:text-[#eb3089] transition-colors duration-200"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="font-medium">Volver al inicio</span>
        </button>

        {/* Registration Card */}
        <div className="bg-white rounded-3xl shadow-2xl border border-[#64c7cd]/30 overflow-hidden">
          {/* Header */}
          <div className="bg-[#eb3089] p-8 pb-4 text-white">
            <div className="flex items-center space-x-4 mb-4">
              <div className="p-4 bg-white/20 rounded-2xl">
                <Building className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Registro de Empresa</h1>
                <p className="text-white/90 text-sm mt-1">Complete los datos de su empresa</p>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mx-8 mt-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-red-800 font-semibold">Error</h3>
                <p className="text-red-700 text-sm mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {/* Company Name and RFC */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Company Name */}
              <div>
                <label className="block text-sm font-semibold text-black mb-2">
                  Nombre de la Empresa *
                </label>
                <div className="relative">
                  <Building className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Ej: Acme Corporation"
                    required
                    className="w-full pl-12 pr-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#64c7cd] focus:border-transparent transition-all duration-300"
                  />
                </div>
              </div>

              {/* RFC */}
              <div>
                <label className="block text-sm font-semibold text-black mb-2">
                  RFC *
                </label>
                <div className="relative">
                  <FileText className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    name="rfc"
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
                    placeholder="Ej: XAXX010101000"
                    maxLength={13}
                    required
                    className={`w-full pl-12 pr-4 py-3 bg-white border-2 rounded-xl text-black placeholder-gray-400 focus:outline-none focus:ring-2 transition-all duration-300 uppercase ${formData.rfc && /^[A-Z]{4}[0-9]{6}[A-Z0-9]{3}$/.test(formData.rfc)
                      ? 'border-[#a5cc55] focus:ring-[#a5cc55]'
                      : rfcError
                        ? 'border-red-400 focus:ring-red-400'
                        : formData.rfc.length > 0
                          ? 'border-yellow-300 focus:ring-yellow-400'
                          : 'border-gray-200 focus:ring-[#64c7cd]'
                      }`}
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
            </div>

            {/* Email and Phone */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-black mb-2">
                  Email de Contacto *
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="contacto@empresa.com"
                    required
                    className="w-full pl-12 pr-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#64c7cd] focus:border-transparent transition-all duration-300"
                  />
                </div>
              </div>

              {/* WhatsApp Number */}
              <div>
                <label className="block text-sm font-semibold text-black mb-2">
                  WhatsApp *
                </label>
                <div className="relative">
                  <MessageCircle className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#25D366] z-10" />
                  <PhoneInput
                    country={'mx'}
                    value={formData.whatsappNumber}
                    onChange={(phone) => setFormData(prev => ({ ...prev, whatsappNumber: phone }))}
                    inputProps={{
                      name: 'whatsappNumber',
                      required: true,
                      className: 'w-full pr-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#64c7cd] focus:border-transparent transition-all duration-300',
                      style: { paddingLeft: '90px' }
                    }}
                    containerClass="w-full"
                    buttonClass="!bg-transparent !border-0 !absolute !left-12"
                    dropdownClass="!bg-white !border-2 !border-gray-200 !rounded-xl"
                    searchClass="!bg-white !border-gray-200 !rounded-lg"
                    enableSearch
                    searchPlaceholder="Buscar país"
                    placeholder="Número con código de país"
                    countryCodeEditable={true}
                  />
                </div>
              </div>
            </div>



            {/* Password and Confirm Password */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Password */}
              <div>
                <label className="block text-sm font-semibold text-black mb-2">
                  Contraseña *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="••••••••"
                    required
                    className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#64c7cd] focus:border-transparent transition-all duration-300 pr-12"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-black transition-colors duration-200"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Mínimo 6 caracteres</p>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-semibold text-black mb-2">
                  Confirmar Contraseña *
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="••••••••"
                    required
                    className={`w-full px-4 py-3 bg-white border-2 rounded-xl text-black placeholder-gray-400 focus:outline-none focus:ring-2 transition-all duration-300 pr-12 ${formData.confirmPassword && formData.password !== formData.confirmPassword
                      ? 'border-red-400 focus:ring-red-400'
                      : formData.confirmPassword && formData.password === formData.confirmPassword
                        ? 'border-[#a5cc55] focus:ring-[#a5cc55]'
                        : 'border-gray-200 focus:ring-[#64c7cd]'
                      }`}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-black transition-colors duration-200"
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
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-4 bg-[#eb3089] text-white font-semibold rounded-2xl shadow-2xl hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#64c7cd] transition-all duration-300 hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative flex items-center justify-center space-x-2">
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      <span>Registrando...</span>
                    </>
                  ) : (
                    <>
                      <Building className="h-5 w-5" />
                      <span>Registrar Empresa</span>
                    </>
                  )}
                </div>
              </button>
            </div>

            {/* Back to Login */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="text-sm text-gray-600 hover:text-[#eb3089] transition-colors duration-200 font-medium underline"
              >
                ¿Ya tiene cuenta?<br className="sm:hidden" /> Inicie sesión
              </button>
            </div>
          </form>
        </div>

        {/* Footer Info */}
        <div className="text-center mt-6 text-sm text-gray-600">
          <p>Al registrarse, su empresa será revisada por nuestro equipo administrativo.</p>
          <p className="mt-1">Recibirá una notificación cuando su cuenta sea aprobada.</p>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowSuccessModal(false)
              navigate('/login')
            }
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-green-300 w-full max-w-md p-6 relative">
            <button
              onClick={() => {
                setShowSuccessModal(false)
                navigate('/login')
              }}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              <XCircle className="h-5 w-5 text-black" />
            </button>

            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>

              <h3 className="text-xl font-bold text-black mb-2">¡Registro Exitoso!</h3>

              <div className="mb-6 text-sm text-black/70">
                <p className="mb-3">
                  Su empresa ha sido registrada exitosamente.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-left">
                  <p className="font-semibold text-blue-900 mb-2">Próximos pasos:</p>
                  <ul className="space-y-2 text-blue-800">
                    <li className="flex items-start space-x-2">
                      <span className="text-blue-600 mt-0.5">•</span>
                      <span>Un administrador revisará su solicitud</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-blue-600 mt-0.5">•</span>
                      <span>Recibirá una notificación cuando sea aprobada</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-blue-600 mt-0.5">•</span>
                      <span>Podrá iniciar sesión con sus credenciales</span>
                    </li>
                  </ul>
                </div>
              </div>

              <button
                onClick={() => {
                  setShowSuccessModal(false)
                  navigate('/login')
                }}
                className="w-full px-6 py-3 bg-[#eb3089] text-white font-semibold rounded-xl hover:shadow-xl transition-all duration-300 hover:scale-105 shadow-lg"
              >
                Ir al Inicio de Sesión
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

