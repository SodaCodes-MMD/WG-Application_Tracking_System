import { useEffect, useState } from "react";
import RegisterPage from "./pages/RegisterPage";
import LoginPage from "./pages/LoginPage";

function App() {
	const [isLoggedIn, setIsLoggedIn] = useState(false);
	const [isLoginPage, setIsLoginPage] = useState(true);

	// Runs when app loads
	useEffect(() => {
		const token = localStorage.getItem("token");

		if (token) {
			setIsLoggedIn(true);
		}
	}, []);

	// Logout function
	const handleLogout = () => {
		localStorage.removeItem("token");
		localStorage.removeItem("user");
		setIsLoggedIn(false);
	};

	// If logged in → show dashboard placeholder
	if (isLoggedIn) {
		return (
			<div>
			<h2>Dashboard (Logged In)</h2>
			<button onClick={handleLogout}>Logout</button>
			</div>
		);
	}

	// Otherwise show auth pages
	return (
		<div>
		<button onClick={() => setIsLoginPage(!isLoginPage)}>
		{isLoginPage ? "Go to Register" : "Go to Login"}
		</button>

		{isLoginPage ? <LoginPage /> : <RegisterPage />}
		</div>
	);
}

export default App;
