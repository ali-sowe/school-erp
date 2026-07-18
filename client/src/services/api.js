import axios from 'axios';

// Auth is handled via an httpOnly cookie set by the server on login, so the
// browser never needs to read or attach a token itself (keeps it out of
// reach of XSS, unlike storing it in localStorage).
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
});

export default api;
