import { useState } from "react";
import RegisterPage from "./pages/RegisterPage";
import LoginPage from "./pages/LoginPage";

function App() {
	// Toggle between pages
	const [isLogin, setIsLogin] = useState(false);

	return (
		<div>
			{/* Toggle button */}
			<button onClick={() => setIsLogin(!isLogin)}>
				{isLogin ? "Go to Register" : "Go to Login"}
			</button>

			{/* Conditional rendering */}
			{isLogin ? <LoginPage /> : <RegisterPage />}
		</div>
	);
}

export default App;
