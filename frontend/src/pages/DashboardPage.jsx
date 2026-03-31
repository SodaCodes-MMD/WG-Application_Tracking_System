import { useEffect, useState } from "react";

export default function DashboardPage({ onLogout }) {
	const [user, setUser] = useState(null);

	// Load user from localStorage
	useEffect(() => {
		const storedUser = localStorage.getItem("user");

		if (storedUser) {
			setUser(JSON.parse(storedUser));
		}
	}, []);

	return (
		<div style={{ display: "flex", height: "100vh" }}>
			
			{/* Sidebar */}
			<div style={{ width: "200px", background: "#222", color: "white", padding: "20px" }}>
				<h3>ATS</h3>
				<ul style={{ listStyle: "none", padding: 0 }}>
					<li>Dashboard</li>
					<li>Jobs</li>
					<li>Profile</li>
				</ul>
			</div>

			{/* Main content */}
			<div style={{ flex: 1, padding: "20px" }}>

				{/* Header */}
				<div style={{ display: "flex", justifyContent: "space-between" }}>
					<h2>Dashboard</h2>

					<div>
						<span style={{ marginRight: "10px" }}>
							{user?.email}
						</span>

						<button onClick={onLogout}>Logout</button>
					</div>
				</div>

				<hr />

				{/* Content area */}
				<div>
					<h3>Welcome to your workspace</h3>
					<p>This is your job tracking dashboard.</p>

					{/* Placeholder cards */}
					<div style={{ marginTop: "20px" }}>
						<div>📄 Applications (coming soon)</div>
						<div>📊 Stats (coming soon)</div>
						<div>📅 Activity (coming soon)</div>
					</div>
				</div>

			</div>
		</div>
	);
}
