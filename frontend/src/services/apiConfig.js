const LOCAL_BACKEND_URL = "http://localhost:5000";
const ONLINE_BACKEND_URL = "https://vlu-campusmarketweb.onrender.com";

const isLocalEnvironment = typeof window !== "undefined" &&
  ["localhost", "127.0.0.1", "0.0.0.0"].includes(window.location.hostname);

const apiOrigin = (
  import.meta.env.VITE_API_BASE_URL ||
  (isLocalEnvironment ? LOCAL_BACKEND_URL : ONLINE_BACKEND_URL)
).replace(/\/+$/, "");

export const API_BASE_URL = apiOrigin;
export const API_BASE = `${apiOrigin}/api`;