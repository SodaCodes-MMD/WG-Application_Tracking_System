/**
 * API Client for ATS Application
 * Handles all HTTP requests to the backend
 */

const API_BASE_URL = 'http://localhost:3000/api';

class ApiClient {
  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  /**
   * Make HTTP request
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Fetch options
   * @returns {Promise<Object>} - Response data
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const response = await fetch(url, {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...options.headers,
      },
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const error = new Error(data?.message || 'Request failed');
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  }

  /**
   * Request password reset
   * @param {string} email - User email
   * @returns {Promise<Object>} - Response
   */
  async forgotPassword(email) {
    return this.request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  /**
   * Validate reset token
   * @param {string} token - Reset token
   * @returns {Promise<Object>} - Response
   */
  async validateResetToken(token) {
    return this.request(`/auth/validate-reset-token/${token}`, {
      method: 'GET',
    });
  }

  /**
   * Reset password
   * @param {string} token - Reset token
   * @param {string} password - New password
   * @returns {Promise<Object>} - Response
   */
  async resetPassword(token, password) {
    return this.request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    });
  }
}

// Create global API client instance
const api = new ApiClient();