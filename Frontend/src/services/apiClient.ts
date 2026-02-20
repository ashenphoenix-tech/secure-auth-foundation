import axios from "axios";
import { getAccessToken, setAccessToken } from "./tokenStore";

const API_BASE_URL = "/api";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// Attach token
apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();

  if (token && token !== "") {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Refresh logic
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as typeof error.config & {
      _retry?: boolean;
    };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshResponse = await apiClient.post("/auth/refresh");
        const newToken = refreshResponse.data.responseData.accessToken;

        setAccessToken(newToken);

        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      } catch {
        setAccessToken(null);
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  },
);

export default apiClient;
