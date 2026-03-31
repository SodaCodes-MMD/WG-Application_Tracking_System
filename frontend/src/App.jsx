import { useState } from "react";
import RegisterPage from "./pages/RegisterPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";

function App() {
	const [token, setToken] = useState(localStorage.getItem("token"));
	const [isLoginPage, setIsLoginPage] = useState(true);

	const handleLogin = (token, user) => {
		localStorage.setItem("token", token);
		localStorage.setItem("user", JSON.stringify(user));

		// 🔥 Force React to re-render immediately
		setToken(token);
	};

	const handleLogout = () => {
		localStorage.removeItem("token");
		localStorage.removeItem("user");
		setToken(null);
	};

	// 🔥 THIS is the only condition that matters
	if (token) {
		return <DashboardPage onLogout={handleLogout} />;
	}

	return (
		<div>
		<button onClick={() => setIsLoginPage(!isLoginPage)}>
		{isLoginPage ? "Go to Register" : "Go to Login"}
		</button>

		{isLoginPage ? (
			<LoginPage onLogin={handleLogin} />
		) : (
			<RegisterPage />
		)}
		</div>
	);
}

export default App;
