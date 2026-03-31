import { useState } from "react";

export default function LoginPage() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");

	const handleSubmit = async (e) => {
		e.preventDefault();

		setError("");
		setSuccess("");

		// Call backend login API
		const res = await fetch("http://localhost:5000/api/auth/login", {
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify({ email, password })
		});

		const data = await res.json();

		if (!data.success) {
			setError(data.error.message);
		} else {
			setSuccess("Login successful!");

			// Store token in browser (VERY IMPORTANT)
			localStorage.setItem("token", data.data.token);

			// Save user info too (optional but useful)
			localStorage.setItem("user", JSON.stringify(data.data.user));
		}
	};

	return (
		<div>
			<h2>Login</h2>

			<form onSubmit={handleSubmit}>
				<input
					type="email"
					placeholder="Email"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
				/>

				<input
					type="password"
					placeholder="Password"
					value={password}
					onChange={(e) => setPassword(e.target.value)}
				/>

				<button type="submit">Login</button>
			</form>

			{error && <p style={{ color: "red" }}>{error}</p>}
			{success && <p style={{ color: "green" }}>{success}</p>}
		</div>
	);
}
