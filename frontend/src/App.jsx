import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import PublicRoute from './components/PublicRoute.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import ResetPassword from './pages/ResetPassword.jsx';

/**
 * Main App Component
 * 
 * Routes:
 * - /login - Public auth page (redirects to dashboard if authenticated)
 * - /register - Public auth page (redirects to dashboard if authenticated)
 * - /forgot-password - Public password reset request
 * - /reset-password - Public password reset confirmation
 * - /dashboard - Protected dashboard (requires authentication)
 * - / - Redirects to dashboard or login based on auth state
 */
function App() {
    const handleLogin = (token, user) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    };

    return (
        <Routes>
            {/* Public Auth Routes - redirect to dashboard if already authenticated */}
            <Route 
                path="/login" 
                element={
                    <PublicRoute>
                        <LoginPage onLogin={handleLogin} />
                    </PublicRoute>
                } 
            />
            <Route 
                path="/register" 
                element={
                    <PublicRoute>
                        <RegisterPage />
                    </PublicRoute>
                } 
            />
            
            {/* Public Password Reset Routes */}
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            
            {/* Protected Routes - require authentication */}
            <Route 
                path="/dashboard" 
                element={
                    <ProtectedRoute>
                        <DashboardPage onLogout={handleLogout} />
                    </ProtectedRoute>
                } 
            />
            
            {/* Root redirect based on auth state */}
            <Route 
                path="/" 
                element={<RootRedirect />} 
            />
            
            {/* Catch-all: redirect to appropriate page */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

/**
 * RootRedirect Component
 * Redirects to /dashboard if authenticated, otherwise to /login
 */
function RootRedirect() {
    const token = localStorage.getItem('token');
    return <Navigate to={token ? '/dashboard' : '/login'} replace />;
}

export default App;
