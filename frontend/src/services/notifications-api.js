const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

// S3-022: try/catch ensures network failures become proper Error instances, not raw TypeErrors
async function request(method, path, body) {
  try {
    const options = { method, headers: getAuthHeaders() };
    if (body) options.body = JSON.stringify(body);
    const res = await fetch(`${API_URL}${path}`, options);
    const data = await res.json();
    if (!res.ok) { const error = new Error(data.error?.message || "Request failed"); error.response = { status: res.status, data }; throw error; }
    return data;
  } catch (err) {
    if (err.response) throw err;
    throw new Error(err.message || "Unable to connect to server");
  }
}

export const notificationsApi = {
  list: (limit = 50) => request("GET", `/notifications?limit=${limit}`),
  getUnreadCount: () => request("GET", "/notifications/unread-count"),
  markAsRead: (id) => request("PATCH", `/notifications/${id}/read`),
  markAllAsRead: () => request("POST", "/notifications/read-all"),
  delete: (id) => request("DELETE", `/notifications/${id}`),
};

export const NOTIFICATION_TYPE_LABELS = {
  DEADLINE_3_DAYS: "3 days warning",
  DEADLINE_1_DAY: "1 day warning",
  DEADLINE_TODAY: "Deadline today",
  DEADLINE_OVERDUE: "Overdue",
};

export const getNotificationIcon = (type) => {
  const icons = {
    DEADLINE_3_DAYS: "⏰",
    DEADLINE_1_DAY: "⚠️",
    DEADLINE_TODAY: "🚨",
    DEADLINE_OVERDUE: "❗",
  };
  return icons[type] || "🔔";
};
