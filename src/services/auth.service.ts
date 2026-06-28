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
