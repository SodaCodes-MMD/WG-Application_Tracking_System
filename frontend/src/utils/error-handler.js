const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export async function apiCall(method, path, body = null) {
  const token = localStorage.getItem("token");
  const options = { method, headers: { "Content-Type": "application/json" } };
  if (token) options.headers["Authorization"] = `Bearer ${token}`;
  if (body) options.body = JSON.stringify(body);

  try {
    const res = await fetch(`${API_URL}${path}`, options);
    const data = await res.json();

    if (res.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
      return { success: false, data: null, error: { code: "UNAUTHORIZED", message: "Session expired. Please log in again." } };
    }

    if (res.status === 403)
      return { success: false, data: null, error: { code: "FORBIDDEN", message: "You do not have permission to perform this action." } };

    if (!res.ok)
      return { success: false, data: null, error: data?.error || { code: "API_ERROR", message: "Request failed" } };

    return { success: true, data: data?.data ?? data, error: null };
  } catch {
    return { success: false, data: null, error: { code: "NETWORK_ERROR", message: "Unable to connect to server" } };
  }
}
