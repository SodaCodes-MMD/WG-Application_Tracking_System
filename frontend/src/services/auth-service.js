const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// ─── Helpers ───────────────────────────────────────────────────────────────────

// Simple frontend password strength check (user feedback only — backend validates too)
export const isStrongPassword = (password) => {
    const regex = /^(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;
    return regex.test(password);
};

// Read the stored JWT from localStorage
export const getToken = () => localStorage.getItem("token");

// ─── Auth endpoints ────────────────────────────────────────────────────────────

export const registerUser = async (email, password) => {
    try {
        const res = await fetch(`${API}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });
        return await res.json();
    } catch {
        return { success: false, error: { code: "NETWORK_ERROR", message: "Unable to connect to server" } };
    }
};

export const loginUser = async (email, password) => {
    try {
        const res = await fetch(`${API}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });
        return await res.json();
    } catch {
        return { success: false, error: { code: "NETWORK_ERROR", message: "Unable to connect to server" } };
    }
};

/**
 * Call the logout endpoint to blacklist the current token on the server.
 * Always clears localStorage and redirects regardless of whether this succeeds.
 */
export const logoutUser = async () => {
    const token = getToken();
    if (!token) return { success: true };

    try {
        const res = await fetch(`${API}/auth/logout`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }
        });
        return await res.json();
    } catch {
        return { success: false, error: { code: "NETWORK_ERROR", message: "Unable to connect to server" } };
    }
};

/**
 * Change the authenticated user's password.
 * @param {string} currentPassword
 * @param {string} newPassword
 */
export const changePassword = async (currentPassword, newPassword) => {
    const token = getToken();

    try {
        const res = await fetch(`${API}/auth/change-password`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ currentPassword, newPassword })
        });
        return await res.json();
    } catch {
        return { success: false, error: { code: "NETWORK_ERROR", message: "Unable to connect to server" } };
    }
};
