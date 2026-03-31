import { Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

/**
 * Public routes: /login, /register, /forgot-password, /reset-password
 * Protected routes: everything else (/, /documents, /profile, /settings)
 *
 * ProtectedRoute redirects to /login if no token is in localStorage.
 * No auth state lives here — localStorage is the source of truth.
 */
function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login"            element={<LoginPage />} />
      <Route path="/register"         element={<RegisterPage />} />
      <Route path="/forgot-password"  element={<ForgotPassword />} />
      <Route path="/reset-password"   element={<ResetPassword />} />

      {/* Protected — DashboardPage handles its own sub-routes */}
      <Route
        path="*"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
