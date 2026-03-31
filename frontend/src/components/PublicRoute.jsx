import { Navigate, useLocation } from 'react-router-dom';

/**
 * PublicRoute Component
 * 
 * Wraps public routes (login, register) that should NOT be accessible
 * to authenticated users. Redirects authenticated users to the dashboard.
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components to render if not authenticated
 * @param {string} props.redirectTo - Where to redirect if authenticated (default: /dashboard)
 */
export default function PublicRoute({ 
    children, 
    redirectTo = '/dashboard' 
}) {
    const location = useLocation();
    const token = localStorage.getItem('token');
    
    // Check if user is already authenticated
    if (token) {
        // If there's a "from" location in state (e.g., from a ProtectedRoute redirect),
        // we could optionally redirect there, but for auth pages we always go to dashboard
        const from = location.state?.from?.pathname;
        return <Navigate to={from || redirectTo} replace />;
    }

    return children;
}
