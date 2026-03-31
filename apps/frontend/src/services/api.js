import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

export const authApi = {
  forgotPassword: (email) => {
    return api.post('/auth/forgot-password', { email })
  },
  
  validateResetToken: (token) => {
    return api.get(`/auth/validate-reset-token/${token}`)
  },
  
  resetPassword: (token, password) => {
    return api.post('/auth/reset-password', { token, password })
  }
}

export default api