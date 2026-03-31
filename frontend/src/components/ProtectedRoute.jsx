import { Navigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';

/**
 * ProtectedRoute Component
 * 
 * Guards routes behind authentication.
 * - First checks localStorage for token (fast synchronous check)
 * - Then validates token with backend /auth/me endpoint
 * - Shows loading state while validating
 * - Redirects unauthenticated users to /login with return URL preservation
 * - Clears invalid tokens from localStorage
 * 
 * Reads the token from localStorage on every render so that a logout
 * (which clears localStorage and navigates to /login) always works correctly.
 */
export default function ProtectedRoute({ children }) {
  const [isValidating, setIsValidating] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const location = useLocation();
  
  const token = localStorage.getItem('token');

  useEffect(() => {
    // Fast path: no token means not authenticated
    if (!token) {
      setIsAuthenticated(false);
      setIsValidating(false);
      return;
    }

    // Validate token with backend
    const validateToken = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/auth/me', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          setIsAuthenticated(true);
        } else {
          // Token is invalid or expired - clean up
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setIsAuthenticated(false);
        }
      } catch (error) {
        // Network error - assume unauthenticated for safety
        console.error('Auth validation failed:', error);
        setIsAuthenticated(false);
      } finally {
        setIsValidating(false);
      }
    };

    validateToken();
  }, [token]);

  // Show loading spinner while validating
  if (isValidating) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <div>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #3498db',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <p style={{ color: '#666', margin: 0 }}>Verifying authentication...</p>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
