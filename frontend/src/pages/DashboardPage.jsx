import { useState } from "react";
import { NavLink, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { logoutUser } from "../services/auth-service.js";
import DashboardHome from "./DashboardHome.jsx";
import DocumentsPage from "./DocumentsPage.jsx";
import ProfilePage from "./ProfilePage.jsx";
import SettingsPage from "./SettingsPage.jsx";
import FlagPet from "../components/FlagPet.jsx";
import NotificationBell from "../components/NotificationBell.jsx";
import "./dashboard.css";

const NAV_ITEMS = [
  { to: "/",          label: "Dashboard",        icon: "▦", end: true  },
  { to: "/documents", label: "Document Library",  icon: "⊞", end: false },
  { to: "/profile",   label: "Profile",           icon: "◯", end: false },
  { to: "/settings",  label: "Settings",          icon: "⚙", end: false },
];

export default function DashboardPage() {
  const navigate = useNavigate();

  const [user] = useState(() => {
    const u = localStorage.getItem("user");
    return u ? JSON.parse(u) : null;
  });

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logoutUser(); // blacklist the token on the server
    } catch {
      // API unavailable — still complete local logout
    }
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="dashboard-layout">

      {/* Mobile overlay — click outside sidebar to close */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={closeSidebar} />
      )}

      {/* Sidebar */}
      <aside className={`sidebar${sidebarOpen ? " sidebar-open" : ""}`}>
        <div className="sidebar-brand">
          <h1>Hirify</h1>
          <p>Your job search, organized</p>
        </div>

        <nav className="sidebar-nav">
          <ul>
            {NAV_ITEMS.map(({ to, label, icon, end }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={end}
                  className={({ isActive }) => isActive ? "active" : undefined}
                  onClick={closeSidebar}
                >
                  <span className="nav-icon">{icon}</span>
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {/* Main area */}
      <div className="dashboard-main">

        {/* Header */}
        <header className="dashboard-header">
          <div className="header-left">
            <button
              className="hamburger"
              onClick={() => setSidebarOpen((o) => !o)}
              aria-label="Toggle navigation"
            >
              <span /><span /><span />
            </button>
            <span className="header-title">Hirify</span>
          </div>

          <div className="header-user">
            <NotificationBell />
            <span className="user-email">{user?.email}</span>
            <button className="btn-logout" onClick={handleLogout}>
              Log out
            </button>
          </div>
        </header>

        {/* Routed content */}
        <main className="dashboard-content">
          <Routes>
            <Route path="/"          element={<DashboardHome />} />
            <Route path="/documents" element={<DocumentsPage />} />
            <Route path="/profile"   element={<ProfilePage user={user} />} />
            <Route path="/settings"  element={<SettingsPage />} />
            <Route path="*"          element={<Navigate to="/" replace />} />
          </Routes>
        </main>

      </div>
      <FlagPet />
    </div>
  );
}
