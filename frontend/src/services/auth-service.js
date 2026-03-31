// Simple frontend validation (user feedback only)
export const isStrongPassword = (password) => {
    const regex = /^(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;
    return regex.test(password);
};

// Get token from storage
export const getToken = () => {
    return localStorage.getItem("token");
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
        return {
            success: false,
            error: {
                code: "NETWORK_ERROR",
                message: "Unable to connect to server"
            }
        };
    }
};

export const loginUser = async (email, password) => {
    try {
        const res = await fetch("http://localhost:5000/api/auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        return data; // matches { success, data: { token, user } } or { success, error }

    } catch (error) {
        return {
            success: false,
            error: {
                code: "NETWORK_ERROR",
                message: "Unable to connect to server"
            }
        };
    }
};
