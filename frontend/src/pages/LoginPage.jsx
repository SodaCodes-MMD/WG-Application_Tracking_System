import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { loginUser } from "../services/auth-service.js";

export default function LoginPage({ onLogin }) {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	
	const navigate = useNavigate();
	const location = useLocation();
	
	// Get the redirect location from state, or default to dashboard
	const from = location.state?.from?.pathname || "/dashboard";

	const handleSubmit = async (e) => {
		e.preventDefault();

		setError("");
		setIsLoading(true);

		try {
			const data = await loginUser(email, password);

			if (!data.success) {
				setError(data.error.message);
				return;
			}

			onLogin(data.data.token, data.data.user);
			
			// Navigate to the originally requested page or dashboard
			navigate(from, { replace: true });
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div style={{ 
			maxWidth: "400px", 
			margin: "40px auto", 
			padding: "20px",
			fontFamily: "system-ui, -apple-system, sans-serif"
		}}>
			<h2 style={{ marginBottom: "20px" }}>Login</h2>

			<form onSubmit={handleSubmit}>
				<div style={{ marginBottom: "15px" }}>
					<input
						type="email"
						placeholder="Email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						style={{
							width: "100%",
							padding: "10px",
							fontSize: "16px",
							border: "1px solid #ddd",
							borderRadius: "4px",
							boxSizing: "border-box"
						}}
						required
						disabled={isLoading}
					/>
				</div>

				<div style={{ marginBottom: "15px" }}>
					<input
						type="password"
						placeholder="Password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						style={{
							width: "100%",
							padding: "10px",
							fontSize: "16px",
							border: "1px solid #ddd",
							borderRadius: "4px",
							boxSizing: "border-box"
						}}
						required
						disabled={isLoading}
					/>
				</div>

				<button 
					type="submit"
					disabled={isLoading}
					style={{
						width: "100%",
						padding: "12px",
						fontSize: "16px",
						backgroundColor: isLoading ? "#ccc" : "#007bff",
						color: "white",
						border: "none",
						borderRadius: "4px",
						cursor: isLoading ? "not-allowed" : "pointer"
					}}
				>
					{isLoading ? "Logging in..." : "Login"}
				</button>
			</form>

			{error && (
				<p style={{ color: "red", marginTop: "15px" }}>{error}</p>
			)}

			<div style={{ marginTop: "20px", textAlign: "center" }}>
				<Link 
					to="/forgot-password"
					style={{ 
						color: "#007bff", 
						textDecoration: "none",
						fontSize: "14px"
					}}
				>
					Forgot password?
				</Link>
			</div>

			<div style={{ marginTop: "15px", textAlign: "center" }}>
				<span style={{ color: "#666", fontSize: "14px" }}>
					Don't have an account?{' '}
				</span>
				<Link 
					to="/register"
					style={{ 
						color: "#007bff", 
						textDecoration: "none",
						fontSize: "14px"
					}}
				>
					Register
				</Link>
			</div>
		</div>
	);
}
