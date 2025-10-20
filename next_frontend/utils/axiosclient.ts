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

    if (error.response?.status === 401 && !originalRequest?._retry) {
      originalRequest._retry = true;

      try {
        await axiosInstance.post("/api/auth/refresh");
        return axiosInstance(originalRequest);
      } catch {
        if (typeof window !== "undefined") {
          window.location.href = "/auth/signin";
        }
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
