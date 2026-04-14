const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request(method, path, body) {
  const options = {
    method,
    headers: getAuthHeaders(),
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const res = await fetch(`${API_URL}${path}`, options);
  const data = await res.json();

  if (!res.ok) {
    if (res.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }

    const error = new Error(data.error?.message || "Request failed");
    error.response = { status: res.status, data };
    throw error;
  }

  return data;
}

export const documentsApi = {
  list: (jobId) =>
    request("GET", jobId ? `/documents?jobId=${jobId}` : "/documents"),

  create: (payload) =>
    request("POST", "/documents", payload),

  remove: (id) =>
    request("DELETE", `/documents/${id}`),

  generateCoverLetter: (jobId) =>
    request("POST", "/documents/generate-cover-letter", { jobId }),
};

export const generateAiCoverLetter = (_token, jobId) => documentsApi.generateCoverLetter(jobId);

export const getDocumentsByJob = (_token, jobId) => documentsApi.list(jobId);

export const deleteDocument = (_token, id) => documentsApi.remove(id);

export const addDocumentVersion = (_token, id, content) =>
  request("POST", `/documents/${id}/versions`, { content });