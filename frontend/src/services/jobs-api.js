const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

async function request(method, path, body) {
  const options = { method, headers: getAuthHeaders() };
  if (body) options.body = JSON.stringify(body);
  const res = await fetch(`${API_URL}${path}`, options);
  const data = await res.json();
  if (!res.ok) { const error = new Error(data.error?.message || "Request failed"); error.response = { status: res.status, data }; throw error; }
  return data;
}

export const jobsApi = {
  list: () => request("GET", "/jobs"),
  listArchived: () => request("GET", "/jobs/archived"),
  get: (id) => request("GET", `/jobs/${id}`),
  create: (payload) => request("POST", "/jobs", payload),
  update: (id, payload) => request("PATCH", `/jobs/${id}`, payload),
  archive: (id) => request("PATCH", `/jobs/${id}/archive`),
  restore: (id) => request("PATCH", `/jobs/${id}/restore`),
  remove: (id) => request("DELETE", `/jobs/${id}`),
};

export const JOB_STATUSES = ["Wishlist", "Applied", "Phone Screen", "Interview", "Offer", "Rejected", "Withdrawn"];

export const STATUS_COLORS = {
  Wishlist:      { bg: "#fff9db", text: "#7a5c00", border: "#f0c800" },
  Applied:       { bg: "#d6f5e0", text: "#0a6b2e", border: "#00aa44" },
  "Phone Screen":{ bg: "#f0c800", text: "#1a1a1a", border: "#c9a800" },
  Interview:     { bg: "#00aa44", text: "#ffffff", border: "#008833" },
  Offer:         { bg: "#1a1a1a", text: "#f0c800", border: "#444444" },
  Rejected:      { bg: "#2d2d2d", text: "#aaaaaa", border: "#555555" },
  Withdrawn:     { bg: "#f5f5f5", text: "#555555", border: "#cccccc" },
};