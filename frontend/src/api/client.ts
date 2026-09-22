import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5073/api",
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
    if (error.response?.status === 401) {
      localStorage.removeItem("draftlex_token");
      localStorage.removeItem("draftlex_user");
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

export default api;