import React, { useState, useRef, useEffect } from 'react'
import { Mail, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react'

interface OTPVerificationProps {
  email: string
  userType: 'client' | 'company'
  onVerify: (otpCode: string) => Promise<void>
  onResend: () => Promise<void>
  onBack?: () => void
}

export const OTPVerification: React.FC<OTPVerificationProps> = ({
  email,
  userType,
  onVerify,
  onResend,
  onBack
}) => {
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCooldown])

  // Auto-focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus()
  }, [])

  const handleChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return

    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)
    setError('')

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }

    // Auto-submit when all 6 digits are entered
    if (value && index === 5 && newOtp.every(digit => digit !== '')) {
      handleSubmit(newOtp.join(''))
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle backspace
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }

    // Handle paste
    if (e.key === 'v' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      navigator.clipboard.readText().then(text => {
        const digits = text.replace(/\D/g, '').slice(0, 6).split('')
        const newOtp = [...otp]
        digits.forEach((digit, i) => {
          if (i < 6) newOtp[i] = digit
        })
        setOtp(newOtp)

        // Focus last filled input or submit if complete
        if (digits.length === 6) {
          inputRefs.current[5]?.focus()
          handleSubmit(newOtp.join(''))
        } else {
          inputRefs.current[digits.length]?.focus()
        }
      })
    }
  }

  const handleSubmit = async (otpCode?: string) => {
    const code = otpCode || otp.join('')

    console.log('[OTPVerification] Submitting OTP:', { code, length: code.length, codeArray: otp })

    if (code.length !== 6) {
      setError('Please enter all 6 digits')
      return
    }

    setLoading(true)
    setError('')

    try {
      console.log('[OTPVerification] Calling onVerify with code:', code)
      await onVerify(code)
      console.log('[OTPVerification] ✅ Verification successful')
      setSuccess(true)
    } catch (err: any) {
      console.error('[OTPVerification] ❌ Verification failed:', err)
      console.error('[OTPVerification] Error response:', err.response?.data)
      setError(err.response?.data?.message || 'Invalid verification code')
      setOtp(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (resendCooldown > 0) return

    setResending(true)
    setError('')

    try {
      await onResend()
      setOtp(['', '', '', '', '', ''])
      setResendCooldown(60) // 60 second cooldown
      inputRefs.current[0]?.focus()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to resend code')
    } finally {
      setResending(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
          <div className="mb-6">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Email Verified!</h2>
            <p className="text-gray-600">
              Your email has been successfully verified.
              {userType === 'company' ? ' Your company registration is now pending admin approval.' : ' You can now log in to your account.'}
            </p>
          </div>
          <button
            onClick={() => window.location.href = '/login'}
            className="btn-primary w-full"
          >
            Go to Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
            <Mail className="w-8 h-8 text-primary-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Verify Your Email</h2>
          <p className="text-gray-600 text-sm">
            We've sent a 6-digit verification code to
          </p>
          <p className="font-medium text-gray-900 mt-1">{email}</p>
        </div>

        {/* OTP Input */}
        <div className="mb-6">
          <div className="flex justify-center gap-2 mb-4">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={el => inputRefs.current[index] = el}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={e => handleChange(index, e.target.value)}
                onKeyDown={e => handleKeyDown(index, e)}
                className={`w-12 h-14 text-center text-2xl font-bold border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all ${
                  error ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                disabled={loading}
              />
            ))}
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg mb-4">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={() => handleSubmit()}
            disabled={loading || otp.some(d => !d)}
            className="btn-primary w-full mb-4"
          >
            {loading ? 'Verifying...' : 'Verify Email'}
          </button>

          {/* Resend Code */}
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">Didn't receive the code?</p>
            <button
              onClick={handleResend}
              disabled={resending || resendCooldown > 0}
              className="text-primary-600 hover:text-primary-700 font-medium text-sm disabled:text-gray-400 disabled:cursor-not-allowed inline-flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${resending ? 'animate-spin' : ''}`} />
              {resendCooldown > 0
                ? `Resend in ${resendCooldown}s`
                : resending
                  ? 'Sending...'
                  : 'Resend Code'}
            </button>
          </div>
        </div>

        {/* Back to Registration */}
        {onBack && (
          <div className="text-center pt-4 border-t">
            <button
              onClick={onBack}
              className="text-gray-600 hover:text-gray-900 text-sm"
            >
              ← Back to Registration
            </button>
          </div>
        )}

        {/* Info */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-xs text-blue-800">
            <strong>Tip:</strong> The verification code will expire in 15 minutes.
            Check your spam folder if you don't see the email.
          </p>
        </div>
      </div>
    </div>
  )
}
