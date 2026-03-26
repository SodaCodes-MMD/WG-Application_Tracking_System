// Simple frontend validation (user feedback only)
export const isStrongPassword = (password) => {
    const regex = /^(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;
    return regex.test(password);
};

// Handles API calls to backend auth endpoints
export const registerUser = async (email, password) => {
    try {
        const res = await fetch("http://localhost:5000/api/auth/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        return data; // already matches { success, data/error }

    } catch (error) {
        // Network / server crash handling
        return {
            success: false,
            error: {
                code: "NETWORK_ERROR",
                message: "Unable to connect to server"
            }
        };
    }
};
