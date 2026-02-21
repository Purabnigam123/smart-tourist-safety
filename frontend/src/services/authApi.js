const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

// ============== AUTH SERVICES ==============

export async function registerTourist(data) {
  const res = await fetch(`${API_URL}/api/auth/tourist/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail || "Registration failed");
  }

  return res.json();
}

export async function loginTourist(data) {
  const res = await fetch(`${API_URL}/api/auth/tourist/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail || "Login failed");
  }

  return res.json();
}

export async function loginAdmin(data) {
  const res = await fetch(`${API_URL}/api/auth/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail || "Login failed");
  }

  return res.json();
}

// ============== TOURIST SERVICES ==============

export async function triggerSOSAuth(data, token) {
  const res = await fetch(`${API_URL}/api/tourist/sos`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error("SOS request failed");
  }

  return res.json();
}

export async function getTouristProfile(token) {
  const res = await fetch(`${API_URL}/api/tourist/profile`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch profile");
  }

  return res.json();
}

export async function geofenceCheck(data) {
  const res = await fetch(`${API_URL}/api/geofence/check`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function riskCheck(data) {
  const res = await fetch(`${API_URL}/api/ai/risk`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function getPublicGeofences() {
  const res = await fetch(`${API_URL}/api/geofences/public`);
  if (!res.ok) throw new Error("Failed to fetch geofences");
  return res.json();
}

export async function contactAdmin(data) {
  const res = await fetch(`${API_URL}/api/tourist/contact-admin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to send message");
  return res.json();
}

// ============== ADMIN SERVICES ==============

export async function getAdminTourists(token) {
  const res = await fetch(`${API_URL}/api/admin/tourists`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch tourists");
  }

  return res.json();
}

export async function getAdminSOSAlerts(token) {
  const res = await fetch(`${API_URL}/api/admin/sos-alerts`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch SOS alerts");
  }

  return res.json();
}

export async function updateSOSStatus(incidentId, status, token) {
  const res = await fetch(`${API_URL}/api/admin/sos-alerts/${incidentId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ status }),
  });

  if (!res.ok) {
    throw new Error("Failed to update SOS status");
  }

  return res.json();
}

export async function getAdminStats(token) {
  const res = await fetch(`${API_URL}/api/admin/stats`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch stats");
  }

  return res.json();
}

export async function getAdminAuditLogs(token) {
  const res = await fetch(`${API_URL}/api/admin/audit-logs`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch audit logs");
  }

  return res.json();
}

export async function getAdminGeofences(token) {
  const res = await fetch(`${API_URL}/api/admin/geofences`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch geofences");
  }

  return res.json();
}

export async function createGeofence(data, token) {
  const res = await fetch(`${API_URL}/api/admin/geofence`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error("Failed to create geofence");
  }

  return res.json();
}

export async function deleteGeofence(geofenceId, token) {
  const res = await fetch(`${API_URL}/api/admin/geofences/${geofenceId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error("Failed to delete geofence");
  }

  return res.json();
}

export async function getAdminMessages(token) {
  const res = await fetch(`${API_URL}/api/admin/messages`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch messages");
  }

  return res.json();
}

export async function updateMessageStatus(messageId, status, token) {
  const res = await fetch(`${API_URL}/api/admin/messages/${messageId}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ status }),
  });

  if (!res.ok) {
    throw new Error("Failed to update message status");
  }

  return res.json();
}
