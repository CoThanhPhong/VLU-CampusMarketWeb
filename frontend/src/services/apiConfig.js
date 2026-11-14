const LOCAL_BACKEND_URL = "http://localhost:5000";

const isLocalEnvironment = typeof window !== "undefined" &&
  ["localhost", "127.0.0.1", "0.0.0.0"].includes(window.location.hostname);

// In production, API calls go to the same origin ("/api/...") and are proxied
// to the backend by the host (netlify.toml / nginx.conf). This avoids CORS and
// keeps the auth cookie first-party.
const apiOrigin = (
  import.meta.env.VITE_API_BASE_URL ||
  (isLocalEnvironment ? LOCAL_BACKEND_URL : "")
).replace(/\/+$/, "");

export const API_BASE_URL = apiOrigin;
export const API_BASE = `${apiOrigin}/api`;
