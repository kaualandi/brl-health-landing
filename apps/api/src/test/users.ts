import { db, schema } from "../db";
import { api } from "./http";

/** Cria um usuário novo (e-mail único) via /auth/register e devolve a sessão + credenciais. */
export async function signup() {
  const email = `${crypto.randomUUID()}@teste.brl`;
  const password = "senha123";
  const res = await api("POST", "/auth/register", { name: "Teste", email, password });
  if (res.status !== 201) throw new Error(`signup falhou: ${JSON.stringify(res.body)}`);
  return { ...res.body, email, password } as {
    user: { id: string; name: string; email: string };
    token: string;
    refreshToken: string;
    email: string;
    password: string;
  };
}

/** Troca o plano direto no banco (usuário novo nasce free). */
export async function setPlan(userId: string | number, planId: "pro" | "family") {
  await db.insert(schema.subscriptions).values({ userId: Number(userId), planId }).onConflictDoUpdate({ target: schema.subscriptions.userId, set: { planId } });
}
