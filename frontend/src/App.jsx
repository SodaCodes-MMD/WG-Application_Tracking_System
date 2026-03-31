import { useState } from "react";
import { Routes, Route } from "react-router-dom";
import RegisterPage from "./pages/RegisterPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";

function AuthPages({ onLogin }) {
	const [isLoginPage, setIsLoginPage] = useState(true);

	return (
		<div>
			<button onClick={() => setIsLoginPage(!isLoginPage)}>
				{isLoginPage ? "Go to Register" : "Go to Login"}
			</button>

			{isLoginPage ? (
				<LoginPage onLogin={onLogin} />
			) : (
				<RegisterPage />
			)}
		</div>
	);
}

function App() {
	const [token, setToken] = useState(localStorage.getItem("token"));

	const handleLogin = (token, user) => {
		localStorage.setItem("token", token);
		localStorage.setItem("user", JSON.stringify(user));
		setToken(token);
	};

	const handleLogout = () => {
		localStorage.removeItem("token");
		localStorage.removeItem("user");
		setToken(null);
	};

	return (
		<Routes>
			<Route path="/forgot-password" element={<ForgotPassword />} />
			<Route path="/reset-password" element={<ResetPassword />} />
			<Route
				path="*"
				element={
					token
						? <DashboardPage onLogout={handleLogout} />
						: <AuthPages onLogin={handleLogin} />
				}
			/>
		</Routes>
	);
}

export default App;
