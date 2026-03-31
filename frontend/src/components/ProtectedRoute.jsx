import { Navigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';

/**
 * ProtectedRoute Component
 * 
 * Wraps routes that require authentication.
 * - Redirects unauthenticated users to /login
 * - Preserves the attempted URL for post-login redirect
 * - Shows loading state while checking authentication
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components to render if authenticated
 * @param {string} props.redirectTo - Where to redirect if not authenticated (default: /login)
 */
export default function ProtectedRoute({ 
    children, 
    redirectTo = '/login' 
}) {
    const [isAuthenticated, setIsAuthenticated] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const location = useLocation();

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        const token = localStorage.getItem('token');
        
        if (!token) {
            setIsAuthenticated(false);
            setIsLoading(false);
            return;
        }

        // Validate token by calling the backend /auth/me endpoint
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
                // Token is invalid or expired
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                setIsAuthenticated(false);
            }
        } catch (error) {
            // Network error - assume unauthenticated for safety
            console.error('Auth check failed:', error);
            setIsAuthenticated(false);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
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

    if (!isAuthenticated) {
        // Redirect to login page, but save the location they were trying to access
        return <Navigate to={redirectTo} state={{ from: location }} replace />;
    }

    return children;
}
