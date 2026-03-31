export default function ProfilePage({ user }) {
  return (
    <>
      <div className="page-header">
        <h2>Profile</h2>
        <p>Manage your account information.</p>
      </div>

      <div className="stub-page">
        <span className="stub-badge">Coming soon</span>
        <h2>Profile Settings</h2>
        <p>
          {user?.email
            ? `Logged in as ${user.email}.`
            : "Update your name, email, and account preferences here."}
          {" "}This feature is under construction.
        </p>
      </div>
    </>
  );
}
