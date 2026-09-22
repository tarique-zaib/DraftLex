import api from "./client";

export interface LoginResponse {
  token: string;
  expiresAt: string;
  fullName: string;
  email: string;
}

export interface CurrentUser {
  id: string;
  email: string;
  role: string;
}

export async function login(email: string, password: string) {
  const { data } = await api.post<LoginResponse>("/auth/login", {
    email,
    password,
  });

  localStorage.setItem("draftlex_token", data.token);
  localStorage.setItem(
    "draftlex_user",
    JSON.stringify({
      fullName: data.fullName,
      email: data.email,
    })
  );

  return data;
}

export async function getCurrentUser() {
  const { data } = await api.get<CurrentUser>("/auth/me");
  return data;
}

export function logout() {
  localStorage.removeItem("draftlex_token");
  localStorage.removeItem("draftlex_user");
}