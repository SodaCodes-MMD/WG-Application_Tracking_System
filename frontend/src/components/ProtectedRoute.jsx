import { Navigate } from "react-router-dom";

/**
 * Guards a route behind authentication.
 * Reads the token from localStorage on every render so that a logout
 * (which clears localStorage and navigates to /login) always works correctly.
 * If no token is found, redirects immediately to /login.
 */
export default function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
