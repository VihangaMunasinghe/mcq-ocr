import axios from "axios";
import{ useRouter } from "next/router";

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL,
  withCredentials: true, // automatically include cookies
});

// Response interceptor to handle token refresh
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If access token expired and refresh token exists, try refresh once
    if (error.response?.status === 401 && !originalRequest?._retry) {
      originalRequest._retry = true;

      try {
        // Call FastAPI refresh endpoint (it will set new access_token cookie)
        await axiosInstance.post("/auth/refresh");

        // Retry the original request
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        console.error("Refresh failed:", refreshError);
        if (typeof window !== "undefined") {
            const router = useRouter();
            router.push("/auth/signin");
        }
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
