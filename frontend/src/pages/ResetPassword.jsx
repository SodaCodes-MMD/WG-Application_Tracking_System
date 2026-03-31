import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { authApi } from '../services/api'
import './AuthForms.css'

function ResetPassword() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isValidating, setIsValidating] = useState(true)
  const [isTokenValid, setIsTokenValid] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [confirmPasswordError, setConfirmPasswordError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [requirements, setRequirements] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false
  })

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setIsValidating(false)
        setIsTokenValid(false)
        return
      }

      try {
        const response = await authApi.validateResetToken(token)
        if (response.data.success) {
          setEmail(response.data.data.email)
          setIsTokenValid(true)
        } else {
          setIsTokenValid(false)
        }
      } catch (err) {
        console.error('Token validation error:', err)
        setIsTokenValid(false)
      } finally {
        setIsValidating(false)
      }
    }

    validateToken()
  }, [token])

  const checkPasswordRequirements = (value) => {
    setRequirements({
      length: value.length >= 8,
      uppercase: /[A-Z]/.test(value),
      lowercase: /[a-z]/.test(value),
      number: /\d/.test(value),
      special: /[@$!%*?&]/.test(value)
    })
  }

  const validatePassword = (value) => {
    if (!value) return 'Password is required'
    if (value.length < 8) return 'Password must be at least 8 characters'
    if (!/[A-Z]/.test(value)) return 'Password must contain an uppercase letter'
    if (!/[a-z]/.test(value)) return 'Password must contain a lowercase letter'
    if (!/\d/.test(value)) return 'Password must contain a number'
    if (!/[@$!%*?&]/.test(value)) return 'Password must contain a special character (@$!%*?&)'
    return ''
  }

  const validateConfirmPassword = (value) => {
    if (!value) return 'Please confirm your password'
    if (value !== password) return 'Passwords do not match'
    return ''
  }

  const handlePasswordChange = (e) => {
    const value = e.target.value
    setPassword(value)
    checkPasswordRequirements(value)
    if (passwordError) setPasswordError(validatePassword(value))
    if (confirmPassword) setConfirmPasswordError(validateConfirmPassword(confirmPassword))
  }

  const handleConfirmPasswordChange = (e) => {
    const value = e.target.value
    setConfirmPassword(value)
    if (confirmPasswordError) setConfirmPasswordError(validateConfirmPassword(value))
  }

  const handlePasswordBlur = () => setPasswordError(validatePassword(password))
  const handleConfirmPasswordBlur = () => setConfirmPasswordError(validateConfirmPassword(confirmPassword))

  const handleSubmit = async (e) => {
    e.preventDefault()

    const passwordValidationError = validatePassword(password)
    const confirmValidationError = validateConfirmPassword(confirmPassword)

    if (passwordValidationError || confirmValidationError) {
      setPasswordError(passwordValidationError)
      setConfirmPasswordError(confirmValidationError)
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const response = await authApi.resetPassword(token, password)
      if (response.data.success) {
        setIsSuccess(true)
      } else {
        setError(response.data.message || 'Failed to reset password')
      }
    } catch (err) {
      console.error('Reset password error:', err)
      if (err.response?.status === 400) {
        setIsTokenValid(false)
      } else {
        setError(err.response?.data?.message || 'Failed to reset password. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (isValidating) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="loading-container">
            <div className="spinner-large"></div>
            <p>Validating your reset link...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!isTokenValid) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h1>Invalid or Expired Link</h1>
            <p>This password reset link is invalid or has expired.</p>
          </div>
          <div className="auth-links">
            <Link to="/forgot-password" className="btn btn-primary">Request New Reset Link</Link>
            <br /><br />
            <Link to="/">Back to Home</Link>
          </div>
        </div>
      </div>
    )
  }

  if (isSuccess) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h1>Password Reset Successful</h1>
            <p>Your password has been reset successfully.</p>
          </div>
          <div className="auth-links">
            <Link to="/" className="btn btn-primary">Go to Home</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Create New Password</h1>
          <p>Please enter your new password below.</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <div className="form-group">
            <label htmlFor="email-display">Email</label>
            <input
              type="email"
              id="email-display"
              value={email}
              disabled
              className="input-disabled"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">New Password</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={password}
                onChange={handlePasswordChange}
                onBlur={handlePasswordBlur}
                placeholder="Enter new password"
                className={passwordError ? 'error' : ''}
                disabled={isLoading}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            {passwordError && <span className="error-message">{passwordError}</span>}

            <div className="password-requirements">
              <p>Password must contain:</p>
              <ul>
                <li className={requirements.length ? 'valid' : ''}>At least 8 characters</li>
                <li className={requirements.uppercase ? 'valid' : ''}>One uppercase letter</li>
                <li className={requirements.lowercase ? 'valid' : ''}>One lowercase letter</li>
                <li className={requirements.number ? 'valid' : ''}>One number</li>
                <li className={requirements.special ? 'valid' : ''}>One special character (@$!%*?&)</li>
              </ul>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="confirm-password">Confirm Password</label>
            <div className="password-input-wrapper">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirm-password"
                value={confirmPassword}
                onChange={handleConfirmPasswordChange}
                onBlur={handleConfirmPasswordBlur}
                placeholder="Confirm your password"
                className={confirmPasswordError ? 'error' : ''}
                disabled={isLoading}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            {confirmPasswordError && (
              <span className="error-message">{confirmPasswordError}</span>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={isLoading}
          >
            {isLoading ? <span className="spinner">Resetting...</span> : 'Reset Password'}
          </button>
        </form>

        {error && (
          <div className="alert alert-error">
            <div className="alert-icon">✗</div>
            <div className="alert-content">
              <h3>Error</h3>
              <p>{error}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ResetPassword
