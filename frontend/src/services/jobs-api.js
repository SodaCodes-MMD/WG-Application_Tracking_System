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
  if (!res.ok) {
    if (res.status === 401) { localStorage.removeItem("token"); localStorage.removeItem("user"); window.location.href = "/login"; }
    const error = new Error(data.error?.message || "Request failed"); error.response = { status: res.status, data }; throw error;
  }
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
  addInterview: (jobId, data) => request("POST", `/jobs/${jobId}/interviews`, data),
  updateInterview: (jobId, interviewId, data) => request("PATCH", `/jobs/${jobId}/interviews/${interviewId}`, data),
  removeInterview: (jobId, interviewId) => request("DELETE", `/jobs/${jobId}/interviews/${interviewId}`),
  addTimelineEvent: (jobId, data) => request("POST", `/jobs/${jobId}/timeline`, data),
  updateTimelineEvent: (jobId, eventId, data) => request("PATCH", `/jobs/${jobId}/timeline/${eventId}`, data),
  removeTimelineEvent: (jobId, eventId) => request("DELETE", `/jobs/${jobId}/timeline/${eventId}`),
  companyResearch: (jobId, context) => request("POST", `/jobs/${jobId}/company-research`, { context }),
};

export const JOB_STATUSES = ["Wishlist", "Applied", "Phone Screen", "Interview", "Offer", "Rejected", "Withdrawn"];

export const JOB_OUTCOMES = ["Pending", "Accepted", "Rejected", "Withdrawn", "Ghosted"];

export const OUTCOME_COLORS = {
  Accepted:  { bg: "#f0fdf4", text: "#15803d", border: "#22c55e" },
  Rejected:  { bg: "#fef2f2", text: "#b91c1c", border: "#ef4444" },
  Withdrawn: { bg: "#f9fafb", text: "#374151", border: "#6b7280" },
  Pending:   { bg: "#fffbeb", text: "#b45309", border: "#f59e0b" },
  Ghosted:   { bg: "#f5f3ff", text: "#6d28d9", border: "#8b5cf6" },
};

export const STATUS_COLORS = {
  Wishlist:      { bg: "#eff6ff", text: "#1d4ed8", border: "#3b82f6" },
  Applied:       { bg: "#fffbeb", text: "#b45309", border: "#f59e0b" },
  "Phone Screen":{ bg: "#f0f9ff", text: "#0369a1", border: "#0ea5e9" },
  Interview:     { bg: "#f5f3ff", text: "#6d28d9", border: "#8b5cf6" },
  Offer:         { bg: "#f0fdf4", text: "#15803d", border: "#22c55e" },
  Rejected:      { bg: "#fef2f2", text: "#b91c1c", border: "#ef4444" },
  Withdrawn:     { bg: "#f9fafb", text: "#374151", border: "#6b7280" },
  Archived:      { bg: "#f9fafb", text: "#374151", border: "#6b7280" },
};