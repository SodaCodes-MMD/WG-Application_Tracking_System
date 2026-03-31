import { useState } from 'react'
import { Link } from 'react-router-dom'
import { authApi } from '../services/api'
import './AuthForms.css'

function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState('')
  const [emailError, setEmailError] = useState('')

  const validateEmail = (value) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!value) {
      return 'Email is required'
    }
    if (!emailRegex.test(value)) {
      return 'Please enter a valid email address'
    }
    return ''
  }

  const handleEmailChange = (e) => {
    const value = e.target.value
    setEmail(value)
    if (emailError) {
      setEmailError(validateEmail(value))
    }
  }

  const handleEmailBlur = () => {
    setEmailError(validateEmail(email))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const validationError = validateEmail(email)
    if (validationError) {
      setEmailError(validationError)
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const response = await authApi.forgotPassword(email)
      
      if (response.data.success) {
        setIsSuccess(true)
      } else {
        // Still show success to prevent email enumeration
        setIsSuccess(true)
      }
    } catch (err) {
      console.error('Forgot password error:', err)
      // Always show success message for security
      setIsSuccess(true)
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h1>📧 Check Your Email</h1>
          </div>
          <div className="alert alert-success">
            <div className="alert-icon">✓</div>
            <div className="alert-content">
              <h3>Reset Link Sent</h3>
              <p>
                If an account with that email exists, we've sent a password reset link. 
                Please check your inbox and spam folder.
              </p>
            </div>
          </div>
          <div className="auth-links">
            <Link to="/" className="btn btn-primary">Back to Home</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>🔒 ATS Application</h1>
          <h2>Reset Your Password</h2>
          <p>Enter your email address and we'll send you a link to reset your password.</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={handleEmailChange}
              onBlur={handleEmailBlur}
              placeholder="Enter your email"
              className={emailError ? 'error' : ''}
              disabled={isLoading}
              autoComplete="email"
            />
            {emailError && <span className="error-message">{emailError}</span>}
          </div>

          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="spinner">Sending...</span>
              </>
            ) : (
              'Send Reset Link'
            )}
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

        <div className="auth-links">
          <Link to="/">← Back to Home</Link>
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword