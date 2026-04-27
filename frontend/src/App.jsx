/*
 * S3-019: skip-to-main-content link for keyboard navigation.
 * S3-022: ErrorBoundary wraps all routes; unknown authenticated routes render
 *         NotFoundPage via DashboardPage's inner catch-all.
 */
import { Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";

/**
 * Public routes: /login, /register, /forgot-password, /reset-password
 * Protected routes: everything else (/, /documents, /profile, /settings)
 *
 * ProtectedRoute redirects to /login if no token is in localStorage.
 * No auth state lives here — localStorage is the source of truth.
 */
function App() {
  return (
    <ErrorBoundary>
      {/* Skip link targets id="main-content" in DashboardPage */}
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <Routes>
        {/* Public */}
        <Route path="/login"            element={<LoginPage />} />
        <Route path="/register"         element={<RegisterPage />} />
        <Route path="/forgot-password"  element={<ForgotPassword />} />
        <Route path="/reset-password"   element={<ResetPassword />} />

        {/* Protected — DashboardPage handles its own sub-routes + 404 */}
        <Route
          path="*"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </ErrorBoundary>
  );
}

export default App;
