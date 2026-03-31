const API = "http://localhost:5000/api";

export const getProfile = async (token) => {
  try {
    const res = await fetch(`${API}/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return await res.json();
  } catch {
    return { success: false, error: { code: "NETWORK_ERROR", message: "Unable to connect to server" } };
  }
};

export const saveProfile = async (token, data) => {
  try {
    const res = await fetch(`${API}/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    return await res.json();
  } catch {
    return { success: false, error: { code: "NETWORK_ERROR", message: "Unable to connect to server" } };
  }
};
