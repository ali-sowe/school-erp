import axios from 'axios';

// Auth is handled via an httpOnly cookie set by the server on login, so the
// browser never needs to read or attach a token itself (keeps it out of
// reach of XSS, unlike storing it in localStorage).
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
});

// Access tokens are short-lived (15m) with a separate httpOnly refresh
// cookie backing them (see server: auth.service.js's refreshAccessToken).
// Without this interceptor, every user would be silently logged out the
// moment their access token expired mid-session — this is what actually
// makes that backend feature work from the user's side.
//
// `refreshPromise` gives the retry attempt "single-flight" behavior: if
// five requests 401 at once (e.g. a page that fires several queries in
// parallel), they all await the *same* in-flight refresh call instead of
// each independently hitting /auth/refresh (which would race against each
// other's rotation and fail all but one of them — see the backend's
// refresh-token reuse detection).
let refreshPromise = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;

    const isAuthEndpoint = config?.url?.startsWith('/auth/login') || config?.url?.startsWith('/auth/refresh');

    if (response?.status !== 401 || isAuthEndpoint || config._retried) {
      return Promise.reject(error);
    }

    config._retried = true;

    try {
      refreshPromise = refreshPromise || api.post('/auth/refresh').finally(() => {
        refreshPromise = null;
      });
      await refreshPromise;

      return api(config);
    } catch (refreshError) {
      return Promise.reject(refreshError);
    }
  }
);

export default api;
