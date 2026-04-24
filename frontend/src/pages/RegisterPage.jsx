import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../services/auth-service.js";
import "./AuthForms.css";

export default function RegisterPage() {
	const navigate = useNavigate();

	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [isLoading, setIsLoading] = useState(false);

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError("");
		setIsLoading(true);

		const res = await registerUser(email, password);

		setIsLoading(false);

		if (!res.success) {
			setError(res.error?.message ?? "Registration failed");
		} else {
			navigate("/login");
		}
	};

	return (
		<div className="auth-container">
			<div className="auth-card">
				<div className="auth-header">
					<h1>Hirify</h1>
					<h2>Join Hirify</h2>
				</div>

				<form onSubmit={handleSubmit} className="auth-form" noValidate>
					<div className="form-group">
						<label htmlFor="email">Email address</label>
						<input
							id="email"
							type="email"
							placeholder="you@example.com"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							autoComplete="email"
							disabled={isLoading}
						/>
					</div>

					<div className="form-group">
						<label htmlFor="password">Password</label>
						<input
							id="password"
							type="password"
							placeholder="Min. 8 chars, include a special character"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							autoComplete="new-password"
							disabled={isLoading}
						/>
					</div>

					{error && (
						<div className="alert alert-error">
							<div className="alert-icon">✗</div>
							<div className="alert-content">
								<p>{error}</p>
							</div>
						</div>
					)}

					<button type="submit" className="btn btn-primary" disabled={isLoading}>
						{isLoading ? <span className="spinner">Creating account...</span> : "Create account"}
					</button>
				</form>

				<div className="auth-links">
					Already have an account?{" "}<Link to="/login">Sign in</Link>
				</div>
			</div>
		</div>
	);
}
