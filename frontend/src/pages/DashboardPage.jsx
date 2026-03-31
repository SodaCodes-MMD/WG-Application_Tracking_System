import { useState } from "react";
import { NavLink, Routes, Route, Navigate } from "react-router-dom";
import DashboardHome from "./DashboardHome.jsx";
import DocumentsPage from "./DocumentsPage.jsx";
import ProfilePage from "./ProfilePage.jsx";
import SettingsPage from "./SettingsPage.jsx";
import "./dashboard.css";

const NAV_ITEMS = [
  { to: "/",          label: "Dashboard",       icon: "▦" },
  { to: "/documents", label: "Document Library", icon: "⊞" },
  { to: "/profile",   label: "Profile",          icon: "◯" },
  { to: "/settings",  label: "Settings",         icon: "⚙" },
];

export default function DashboardPage({ onLogout }) {
  const [user] = useState(() => {
    const u = localStorage.getItem("user");
    return u ? JSON.parse(u) : null;
  });

  return (
    <div className="dashboard-layout">

      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <h1>ATS</h1>
          <p>Applicant Tracking System</p>
        </div>

        <nav className="sidebar-nav">
          <ul>
            {NAV_ITEMS.map(({ to, label, icon }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={to === "/"}
                  className={({ isActive }) => isActive ? "active" : undefined}
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
          <span className="header-title">ATS Dashboard</span>
          <div className="header-user">
            <span className="user-email">{user?.email}</span>
            <button className="btn-logout" onClick={onLogout}>
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
    </div>
  );
}
