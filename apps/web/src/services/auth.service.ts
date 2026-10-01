import { api } from "@/lib/axios";
import type { AuthResponse } from "@/types";

type Message = { message: string };

export async function loginUser(
  email: string,
  password: string,
): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("/auth/login", {
    email,
    password,
  });
  return data;
}

export async function registerUser(
  name: string,
  email: string,
  password: string,
): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("/auth/register", {
    name,
    email,
    password,
  });
  return data;
}

/** Encerra a sessão no servidor (revoga o refresh token). Best-effort. */
export async function logoutUser(refreshToken: string): Promise<void> {
  await api.post("/auth/logout", { refreshToken });
}

export async function requestPasswordReset(email: string): Promise<Message> {
  // Resposta sempre 200 — o backend não revela se o e-mail existe (privacidade).
  const { data } = await api.post<Message>("/auth/forgot", { email });
  return data;
}

export async function resetPassword(
  token: string,
  password: string,
): Promise<Message> {
  const { data } = await api.post<Message>("/auth/reset", { token, password });
  return data;
}

/**
 * Reenvia o código de verificação. Endpoint autenticado e **sem body** — o
 * backend identifica o e-mail pelo JWT da sessão (token anexado pelo axios).
 */
export async function requestEmailVerification(): Promise<Message> {
  const { data } = await api.post<Message>("/auth/verify/resend", {});
  return data;
}

export async function verifyEmail(code: string): Promise<Message> {
  const { data } = await api.post<Message>("/auth/verify", { code });
  return data;
}
