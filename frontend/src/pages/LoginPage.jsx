import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser } from "../services/auth-service.js";
import "./AuthForms.css";

export default function LoginPage() {
	const navigate = useNavigate();

	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [isLoading, setIsLoading] = useState(false);

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError("");
		setIsLoading(true);

		const data = await loginUser(email, password);

		setIsLoading(false);

		if (!data.success) {
			setError(data.error?.message ?? "Login failed");
			return;
		}

		localStorage.setItem("token", data.data.token);
		localStorage.setItem("user", JSON.stringify(data.data.user));
		navigate("/");
	};

	return (
		<div className="auth-container">
			<div className="auth-card">
				<div className="auth-header">
					<h1>Hirify</h1>
					<h2>Sign in to your account</h2>
				</div>

				<form onSubmit={handleSubmit} className="auth-form" noValidate>
					<div className="form-group">
						<label htmlFor="email">Email address</label>
						<input
							id="email"
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							placeholder="you@example.com"
							autoComplete="email"
							disabled={isLoading}
						/>
					</div>

					<div className="form-group">
						<label htmlFor="password">Password</label>
						<input
							id="password"
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							placeholder="Your password"
							autoComplete="current-password"
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
						{isLoading ? <span className="spinner">Signing in...</span> : "Sign in"}
					</button>
				</form>

				<div className="auth-links">
					<Link to="/forgot-password">Forgot your password?</Link>
					<br /><br />
					Don&apos;t have an account?{" "}<Link to="/register">Create one</Link>
				</div>
			</div>
		</div>
	);
}
