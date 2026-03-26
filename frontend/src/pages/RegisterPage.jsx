import { useState } from "react";
import { registerUser } from "../services/auth-service.js";

export default function RegisterPage() {
	// Store form inputs
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");

	// UI feedback states
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");

	// Handles form submission
	const handleSubmit = async (e) => {
		e.preventDefault(); // prevent page refresh

		setError("");
		setSuccess("");

		// Call backend API
		const res = await registerUser(email, password);

		// Handle response
		if (!res.success) {
			setError(res.error.message);
		} else {
			setSuccess("Account created successfully!");
		}
	};

	return (
		<div>
			<h2>Register</h2>

			<form onSubmit={handleSubmit}>
				{/* Email input */}
				<input
					type="email"
					placeholder="Email"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
				/>

				{/* Password input */}
				<input
					type="password"
					placeholder="Password"
					value={password}
					onChange={(e) => setPassword(e.target.value)}
				/>

				<button type="submit">Register</button>
			</form>

			{/* Error message */}
			{error && <p style={{ color: "red" }}>{error}</p>}

			{/* Success message */}
			{success && <p style={{ color: "green" }}>{success}</p>}
		</div>
	);
}
