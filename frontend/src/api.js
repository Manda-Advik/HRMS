// Single source of truth for the backend URL.
// Set VITE_API_URL in your .env (dev) or deployment environment (prod).
const BACKEND = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default BACKEND;
