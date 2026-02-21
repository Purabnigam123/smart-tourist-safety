const BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

export async function registerTourist(data) {
  const res = await fetch(`${BASE_URL}/api/tourist/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function triggerSOS(data) {
  const res = await fetch(`${BASE_URL}/api/sos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function geofenceCheck(data) {
  const res = await fetch(`${BASE_URL}/api/geofence/check`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function riskCheck(data) {
  const res = await fetch(`${BASE_URL}/api/ai/risk`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}
export async function getPublicGeofences() {
  const res = await fetch(`${BASE_URL}/api/geofences/public`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  return res.json();
}