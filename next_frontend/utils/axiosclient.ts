import axios from "axios";

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000",
  withCredentials: true,
});

// Response interceptor to handle token refresh
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check if this is a 401 error and not already a retry attempt
    // Also exclude auth endpoints (login, register, refresh) to prevent infinite loops
    if (
      error.response?.status === 401 &&
      !originalRequest?._retry &&
      !originalRequest?.url?.includes("/api/auth/refresh") &&
      !originalRequest?.url?.includes("/api/auth/login") &&
      !originalRequest?.url?.includes("/api/auth/register")
    ) {
      originalRequest._retry = true;

      try {
        // Make the refresh request with a flag to prevent interceptor loops
        await axios.post(
          `${
            process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"
          }/api/auth/refresh`,
          {},
          { withCredentials: true }
        );

        // If refresh was successful, retry the original request
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        // Refresh failed, redirect to signin
        if (
          typeof window !== "undefined" &&
          !window.location.href.includes("/auth")
        ) {
          window.location.href = "/auth/signin";
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
