import axios from "axios";

const api = axios.create({
  baseURL: "https://4mf00dhb-5073.inc1.devtunnels.ms/api",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("draftlex_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response?.status === 401 &&
      !error.config?.url?.includes("/Documents/") &&
      !error.config?.url?.endsWith("/pdf")
    ) {
      localStorage.removeItem("draftlex_token");
      localStorage.removeItem("draftlex_user");
      window.location.href = "/login";
    }

    return Promise.reject(error);
  },
);

export default api;
