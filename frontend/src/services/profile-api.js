const API = "http://localhost:5000/api";

async function send(token, method, path, body) {
  try {
    const opts = {
      method,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    };
    if (body !== undefined) opts.body = JSON.stringify(body);
    const res = await fetch(`${API}${path}`, opts);
    return await res.json();
  } catch {
    return { success: false, error: { code: "NETWORK_ERROR", message: "Unable to connect to server" } };
  }
}

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

export const saveProfile = (token, data) => send(token, "PUT", "/profile", data);

// ── Experience ──────────────────────────────────────────────────────────────

export const addExperience    = (token, data)             => send(token, "POST",   "/profile/experience",          data);
export const updateExperience = (token, entryId, data)    => send(token, "PATCH",  `/profile/experience/${entryId}`, data);
export const deleteExperience = (token, entryId)          => send(token, "DELETE", `/profile/experience/${entryId}`);
export const reorderExperience = (token, orderedIds)      => send(token, "PATCH",  "/profile/experience/reorder",  { orderedIds });

// ── Education ───────────────────────────────────────────────────────────────

export const addEducation    = (token, data)           => send(token, "POST",   "/profile/education",          data);
export const updateEducation = (token, entryId, data)  => send(token, "PATCH",  `/profile/education/${entryId}`, data);
export const deleteEducation = (token, entryId)        => send(token, "DELETE", `/profile/education/${entryId}`);
