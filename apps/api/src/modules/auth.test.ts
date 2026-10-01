import { describe, expect, it } from "bun:test";
import { eq } from "drizzle-orm";
import { Elysia } from "elysia";
import { db, schema } from "../db";
import { auth } from "../lib/auth";
import { api } from "../test/http";
import { signup } from "../test/users";

const EXPIRED = "Sessão expirada. Faça login novamente.";

describe("POST /auth/login", () => {
  it("loga a conta demo", async () => {
    const res = await api("POST", "/auth/login", { email: " DEMO@brl.com ", password: "123456" });
    expect(res.status).toBe(200);
    expect(typeof res.body.user.id).toBe("string");
    expect(res.body.user.email).toBe("demo@brl.com");
    expect(res.body.token).toBeTruthy();
    expect(res.body.refreshToken).toBeTruthy();
  });

  it("senha errada e usuário inexistente dão 401", async () => {
    for (const body of [
      { email: "demo@brl.com", password: "errada" },
      { email: "naoexiste@brl.com", password: "123456" },
    ]) {
      const res = await api("POST", "/auth/login", body);
      expect(res.status).toBe(401);
      expect(res.body).toEqual({ error: "Credenciais inválidas" });
    }
  });

  it("campos vazios dão 400 { errors }", async () => {
    const res = await api("POST", "/auth/login", { email: "", password: "" });
    expect(res.status).toBe(400);
    expect(res.body.errors.length).toBeGreaterThan(0);
  });
});

describe("POST /auth/register", () => {
  it("cria usuário com plano free e permite login", async () => {
    const s = await signup();
    expect(typeof s.user.id).toBe("string");
    const [sub] = await db
      .select()
      .from(schema.subscriptions)
      .where(eq(schema.subscriptions.userId, Number(s.user.id)));
    expect(sub).toMatchObject({ planId: "free", status: "active" });
    const login = await api("POST", "/auth/login", { email: s.email.toUpperCase(), password: s.password });
    expect(login.status).toBe(200);
  });

  it("e-mail duplicado dá 400", async () => {
    const s = await signup();
    const res = await api("POST", "/auth/register", { name: "X", email: s.email, password: "123456" });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ errors: ["E-mail já cadastrado."] });
  });

  it("valida nome, e-mail e senha", async () => {
    const res = await api("POST", "/auth/register", { name: " ", email: "x", password: "123" });
    expect(res.status).toBe(400);
    expect(res.body.errors).toHaveLength(3);
  });
});

describe("refresh e logout", () => {
  it("rotaciona o refresh e rejeita reuso", async () => {
    const s = await signup();
    const ok = await api("POST", "/auth/refresh", { refreshToken: s.refreshToken });
    expect(ok.status).toBe(200);
    expect(ok.body.refreshToken).not.toBe(s.refreshToken);
    expect(ok.body.user.id).toBe(s.user.id);
    const reuse = await api("POST", "/auth/refresh", { refreshToken: s.refreshToken });
    expect(reuse.status).toBe(401);
    expect(reuse.body).toEqual({ error: EXPIRED });
  });

  it("refresh inválido ou expirado dá 401", async () => {
    expect((await api("POST", "/auth/refresh", { refreshToken: "lixo" })).status).toBe(401);
    const s = await signup();
    await db
      .update(schema.refreshTokens)
      .set({ expiresAt: new Date(Date.now() - 1000) })
      .where(eq(schema.refreshTokens.userId, Number(s.user.id)));
    expect((await api("POST", "/auth/refresh", { refreshToken: s.refreshToken })).status).toBe(401);
  });

  it("logout revoga e responde 200 sempre", async () => {
    const s = await signup();
    const res = await api("POST", "/auth/logout", { refreshToken: s.refreshToken });
    expect(res).toMatchObject({ status: 200, body: { message: "Sessão encerrada" } });
    expect((await api("POST", "/auth/refresh", { refreshToken: s.refreshToken })).status).toBe(401);
    expect((await api("POST", "/auth/logout", {})).status).toBe(200);
    expect((await api("POST", "/auth/logout")).status).toBe(200);
  });
});

describe("macro auth", () => {
  const app = new Elysia().use(auth).get("/x", ({ userId }) => String(userId), { auth: true });
  const get = (authorization?: string) =>
    app.handle(new Request("http://localhost/x", { headers: authorization ? { authorization } : {} }));

  it("401 sem token ou com token inválido, 200 com token válido", async () => {
    expect((await get()).status).toBe(401);
    expect((await get("Bearer lixo")).status).toBe(401);
    const s = await signup();
    const res = await get(`Bearer ${s.token}`);
    expect(res.status).toBe(200);
    expect(await res.text()).toBe(s.user.id);
  });
});
