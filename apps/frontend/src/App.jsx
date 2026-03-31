import { Routes, Route, Link } from 'react-router-dom'
import ForgotPassword from './components/ForgotPassword'
import ResetPassword from './components/ResetPassword'
import './App.css'

function Home() {
  return (
    <div className="home-container">
      <h1>🔒 ATS Application</h1>
      <p>Welcome to the Applicant Tracking System</p>
      <div className="auth-links">
        <Link to="/forgot-password" className="btn">Forgot Password?</Link>
      </div>
    </div>
  )
}

function App() {
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
      </Routes>
    </div>
  )
}

export default App