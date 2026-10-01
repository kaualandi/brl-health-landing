import { describe, expect, it } from "bun:test";
import { sentEmails } from "../lib/email";
import { api } from "../test/http";
import { signup } from "../test/users";

const lastTo = (to: string) => sentEmails.findLast((m) => m.to === to)!.text;
const resetToken = (to: string) => lastTo(to).match(/token=([\w-]+)/)![1]!;
const code = (to: string) => lastTo(to).match(/\d{6}/)![0];

describe("recuperação de senha", () => {
  it("forgot responde igual para conta inexistente e não envia e-mail", async () => {
    const res = await api("POST", "/auth/forgot", { email: "ninguem@teste.brl" });
    expect(res.status).toBe(200);
    expect(res.body.message).toContain("Se houver uma conta");
    expect(sentEmails.some((m) => m.to === "ninguem@teste.brl")).toBe(false);
  });

  it("reset troca a senha, revoga refresh e o token é de uso único", async () => {
    const u = await signup();
    await api("POST", "/auth/forgot", { email: u.email });
    const token = resetToken(u.email);
    expect((await api("POST", "/auth/reset", { token, password: "123" })).body.errors).toEqual([
      "A senha deve ter ao menos 6 caracteres.",
    ]);
    const ok = await api("POST", "/auth/reset", { token, password: "novaSenha1" });
    expect(ok.body).toEqual({ message: "Senha redefinida" });
    expect((await api("POST", "/auth/refresh", { refreshToken: u.refreshToken })).status).toBe(401);
    expect((await api("POST", "/auth/login", { email: u.email, password: u.password })).status).toBe(401);
    expect((await api("POST", "/auth/login", { email: u.email, password: "novaSenha1" })).status).toBe(200);
    const again = await api("POST", "/auth/reset", { token, password: "outraSenha1" });
    expect(again.status).toBe(400);
    expect(again.body).toEqual({ errors: ["Link inválido ou expirado"] });
    expect((await api("POST", "/auth/reset", { token: "lixo", password: "abcdef" })).status).toBe(400);
  });
});

describe("verificação de e-mail", () => {
  it("exige autenticação", async () => {
    expect((await api("POST", "/auth/verify/resend")).status).toBe(401);
    expect((await api("POST", "/auth/verify", { code: "123456" })).status).toBe(401);
  });

  it("verifica com o código enviado e não aceita reuso", async () => {
    const u = await signup();
    const res = await api("POST", "/auth/verify/resend", undefined, u.token);
    expect(res.body.message).toBe("Enviamos um novo código para o seu e-mail.");
    const first = code(u.email);
    await api("POST", "/auth/verify/resend", undefined, u.token);
    const second = code(u.email);
    if (first !== second) expect((await api("POST", "/auth/verify", { code: first }, u.token)).status).toBe(400);
    expect((await api("POST", "/auth/verify", { code: "12ab" }, u.token)).body.errors).toEqual([
      "Código inválido. Confira os 6 dígitos.",
    ]);
    const ok = await api("POST", "/auth/verify", { code: second }, u.token);
    expect(ok.body).toEqual({ message: "E-mail verificado" });
    const again = await api("POST", "/auth/verify", { code: second }, u.token);
    expect(again.body.errors).toEqual(["Código inválido ou expirado. Solicite um novo."]);
  });

  it("código de outro usuário dá 400", async () => {
    const a = await signup();
    const b = await signup();
    await api("POST", "/auth/verify/resend", undefined, a.token);
    const res = await api("POST", "/auth/verify", { code: code(a.email) }, b.token);
    expect(res.status).toBe(400);
  });
});

describe("DELETE /me/account", () => {
  it("apaga a conta e o login seguinte falha", async () => {
    const u = await signup();
    expect((await api("DELETE", "/me/account")).status).toBe(401);
    const res = await api("DELETE", "/me/account", undefined, u.token);
    expect(res.body).toEqual({ message: "Conta e dados excluídos" });
    expect((await api("POST", "/auth/login", { email: u.email, password: u.password })).status).toBe(401);
    expect((await api("DELETE", "/me/account", undefined, u.token)).status).toBe(404);
  });
});
