const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

async function request(method, path, body) {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' }
  };
  if (body) options.body = JSON.stringify(body);

  const res = await fetch(`${API_URL}${path}`, options);
  const data = await res.json();

  if (!res.ok) {
    const error = new Error(data.message || 'Request failed');
    error.response = { status: res.status, data };
    throw error;
  }

  return { data };
}

export const authApi = {
  forgotPassword: (email) =>
    request('POST', '/auth/forgot-password', { email }),

  validateResetToken: (token) =>
    request('GET', `/auth/validate-reset-token/${token}`),

  resetPassword: (token, password) =>
    request('POST', '/auth/reset-password', { token, password })
};

export default authApi;
