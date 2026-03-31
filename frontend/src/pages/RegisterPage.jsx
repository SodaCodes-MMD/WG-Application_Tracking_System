import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerUser, isStrongPassword } from "../services/auth-service.js";

export default function RegisterPage() {
	// Store form inputs
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");

	// UI feedback states
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	
	const navigate = useNavigate();

	// Handles form submission
	const handleSubmit = async (e) => {
		e.preventDefault(); // prevent page refresh

		setError("");
		setSuccess("");
		
		// Client-side password validation
		if (!isStrongPassword(password)) {
			setError("Password must be at least 8 characters and contain at least one special character.");
			return;
		}
		
		setIsLoading(true);

		try {
			// Call backend API
			const res = await registerUser(email, password);

			// Handle response
			if (!res.success) {
				setError(res.error.message);
			} else {
				setSuccess("Account created successfully! Redirecting to login...");
				// Clear form
				setEmail("");
				setPassword("");
				// Redirect to login after a short delay
				setTimeout(() => {
					navigate("/login");
				}, 2000);
			}
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
			<h2 style={{ marginBottom: "20px" }}>Register</h2>

			<form onSubmit={handleSubmit}>
				{/* Email input */}
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

				{/* Password input */}
				<div style={{ marginBottom: "15px" }}>
					<input
						type="password"
						placeholder="Password (min 8 chars, 1 special char)"
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
						backgroundColor: isLoading ? "#ccc" : "#28a745",
						color: "white",
						border: "none",
						borderRadius: "4px",
						cursor: isLoading ? "not-allowed" : "pointer"
					}}
				>
					{isLoading ? "Creating account..." : "Register"}
				</button>
			</form>

			{/* Error message */}
			{error && (
				<p style={{ color: "red", marginTop: "15px" }}>{error}</p>
			)}

			{/* Success message */}
			{success && (
				<p style={{ color: "green", marginTop: "15px" }}>{success}</p>
			)}
			
			<div style={{ marginTop: "20px", textAlign: "center" }}>
				<span style={{ color: "#666", fontSize: "14px" }}>
					Already have an account?{' '}
				</span>
				<Link 
					to="/login"
					style={{ 
						color: "#007bff", 
						textDecoration: "none",
						fontSize: "14px"
					}}
				>
					Login
				</Link>
			</div>
		</div>
	);
}
