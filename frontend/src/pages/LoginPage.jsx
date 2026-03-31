import { useState } from "react";
import { loginUser } from "../services/auth-service.js";

export default function LoginPage({ onLogin }) {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");

	const handleSubmit = async (e) => {
		e.preventDefault();

		setError("");

		const data = await loginUser(email, password);

		if (!data.success) {
			setError(data.error.message);
			return;
		}

		onLogin(data.data.token, data.data.user);
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
		</div>
	);
}
