import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
});

// Request Interceptor: Attach the token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('orbit_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle 401/403 and automatically refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If the error is 401 or 403 and we haven't already retried this request
    if ((error.response?.status === 401 || error.response?.status === 403) && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('orbit_refreshToken');
        if (!refreshToken) {
          // No refresh token available, force logout
          throw new Error('No refresh token available');
        }

        // Call the refresh endpoint (do not use 'api' here to avoid infinite loops)
        const refreshResponse = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/users/refresh`, {
          refreshToken,
        });

        const newAccessToken = refreshResponse.data.token;

        // Save the new access token
        localStorage.setItem('orbit_token', newAccessToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);

      } catch (refreshError) {
        // Refresh token is expired or invalid. Force logout.
        localStorage.removeItem('orbit_token');
        localStorage.removeItem('orbit_refreshToken');
        localStorage.removeItem('orbit_userId');
        window.location.href = '/login?expired=true';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
