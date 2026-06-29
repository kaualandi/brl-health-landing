import type { AuthResponse } from "@/types";

const DEMO_EMAIL = "demo@brl.com";
const DEMO_PASSWORD = "123456";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function loginUser(
  email: string,
  password: string,
): Promise<AuthResponse> {
  await wait(800);

  if (email === DEMO_EMAIL && password === DEMO_PASSWORD) {
    return {
      user: {
        id: "usr_demo_001",
        name: "Kauã Demo",
        email: DEMO_EMAIL,
      },
      token: "mock.jwt.token.demo",
    };
  }

  throw new Error("Credenciais inválidas");
  // TODO: substituir por api.post('/auth/login')
}

export async function registerUser(
  name: string,
  email: string,
  password: string,
): Promise<AuthResponse> {
  await wait(1000);

  void password;

  return {
    user: {
      id: `usr_${Date.now()}`,
      name,
      email,
    },
    token: "mock.jwt.token.new-user",
  };
  // TODO: substituir por api.post('/auth/register')
}

export async function requestPasswordReset(
  email: string,
): Promise<{ message: string }> {
  await wait(800);

  void email;

  // Resolve sempre — não revelamos se o e-mail existe (privacidade).
  return { message: "Se houver uma conta, enviamos um link de redefinição." };
  // TODO: substituir por api.post('/auth/forgot')
}

export async function resetPassword(
  token: string,
  password: string,
): Promise<{ message: string }> {
  await wait(800);

  void password;

  if (!token) {
    throw new Error("Link inválido ou expirado");
  }

  return { message: "Senha redefinida" };
  // TODO: substituir por api.post('/auth/reset')
}

export async function requestEmailVerification(
  email: string,
): Promise<{ message: string }> {
  await wait(800);

  void email;

  return { message: "Enviamos um novo código para o seu e-mail." };
  // TODO: substituir por api.post('/auth/verify/resend')
}

export async function verifyEmail(code: string): Promise<{ message: string }> {
  await wait(800);

  // Mock: aceita qualquer código de 6 dígitos (o backend valida de verdade).
  if (!/^\d{6}$/.test(code.trim())) {
    throw new Error("Código inválido. Confira os 6 dígitos e tente de novo.");
  }

  return { message: "E-mail verificado" };
  // TODO: substituir por api.post('/auth/verify')
}
