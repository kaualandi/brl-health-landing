import { afterEach, describe, expect, it } from "bun:test";
import { config } from "../config";
import { api } from "../test/http";
import { signup } from "../test/users";
import { checkoutErrors, planChangeErrors } from "./plans.rules";

const OK = "4111111111111111";
const DECLINED = "Pagamento recusado pelo emissor. Tente outro cartão.";
const free = { id: "free", rank: 0 };
const pro = { id: "pro", rank: 1 };
const base = { current: free, hasPendingCharge: false, stripeEnabled: false };
const checkout = (token: string, planId: string, number = OK) =>
  api("POST", "/billing/checkout", { planId, card: { holder: "A", number, expiry: "12/30", cvv: "123" } }, token);

afterEach(() => {
  config.stripeSecretKey = undefined;
});

describe("regras puras", () => {
  it("planChangeErrors", () => {
    expect(planChangeErrors({ ...base, target: undefined })).toEqual(["Plano-alvo inexistente."]);
    expect(planChangeErrors({ ...base, target: free })).toEqual(["Você já está neste plano."]);
    expect(planChangeErrors({ ...base, target: pro })).toEqual([DECLINED]);
    expect(planChangeErrors({ ...base, target: pro, cardNumber: OK })).toEqual([]);
    expect(planChangeErrors({ ...base, target: pro, cardNumber: "1230000" })).toEqual([DECLINED]);
    expect(planChangeErrors({ ...base, current: pro, target: free })).toEqual([]);
    expect(planChangeErrors({ ...base, target: pro, cardNumber: OK, hasPendingCharge: true })).toHaveLength(1);
    expect(planChangeErrors({ ...base, target: pro, cardNumber: OK, stripeEnabled: true })).toEqual([
      "Para fazer upgrade, use o checkout de pagamento.",
    ]);
  });

  it("checkoutErrors", () => {
    expect(checkoutErrors(pro, OK, false)).toEqual([]);
    expect(checkoutErrors(free, OK, false)).toEqual(["Plano inexistente."]);
    expect(checkoutErrors(pro, "123", false)).toEqual(["Número de cartão inválido."]);
  });
});

describe("planos e assinatura", () => {
  it("GET /plans", async () => {
    const { status, body } = await api("GET", "/plans");
    expect(status).toBe(200);
    expect(body).toEqual([
      { id: "free", monthlyPrice: 0, credits: 1 },
      { id: "pro", monthlyPrice: 29.9, credits: 4 },
      { id: "family", monthlyPrice: 49.9, credits: 8 },
    ]);
  });

  it("GET /me/subscription exige token e muda após upgrade", async () => {
    expect((await api("GET", "/me/subscription")).status).toBe(401);
    const { token } = await signup();
    const sub = (await api("GET", "/me/subscription", undefined, token)).body;
    expect(sub).toEqual({ planId: "free", credits: 1, hasPendingCharge: false });
    await api("PUT", "/me/plan", { target: "pro", cardNumber: OK }, token);
    expect((await api("GET", "/me/subscription", undefined, token)).body).toEqual({
      planId: "pro",
      credits: 4,
      hasPendingCharge: false,
    });
  });

  it("PUT /me/plan: regras e downgrade livre", async () => {
    const { token } = await signup();
    const put = (b: object) => api("PUT", "/me/plan", b, token);
    expect((await api("PUT", "/me/plan", { target: "pro" })).status).toBe(401);
    expect((await put({ target: "xx" })).body.errors).toEqual(["Plano-alvo inexistente."]);
    expect((await put({ target: "free" })).body.errors).toEqual(["Você já está neste plano."]);
    expect((await put({ target: "pro" })).body.errors).toEqual([DECLINED]);
    expect((await put({ target: "pro", cardNumber: "4111111111110000" })).status).toBe(400);
    expect(await put({ target: "family", cardNumber: OK })).toMatchObject({ status: 200, body: { plan: "family" } });
    expect((await put({ target: "free" })).body).toEqual({ plan: "free" });
  });

  it("PUT /me/plan: Stripe configurado bloqueia upgrade", async () => {
    const { token } = await signup();
    config.stripeSecretKey = "sk_test_x";
    const res = await api("PUT", "/me/plan", { target: "pro", cardNumber: OK }, token);
    expect(res.body.errors).toEqual(["Para fazer upgrade, use o checkout de pagamento."]);
  });
});

describe("POST /billing/checkout", () => {
  it("sucesso ativa o plano", async () => {
    const { token } = await signup();
    const { status, body } = await checkout(token, "pro");
    expect(status).toBe(200);
    expect(body.planId).toBe("pro");
    expect(new Date(body.paidAt).toISOString()).toBe(body.paidAt);
    expect((await api("GET", "/me/subscription", undefined, token)).body.planId).toBe("pro");
  });

  it("401 e cada 400", async () => {
    expect((await checkout("", "pro")).status).toBe(401);
    const { token } = await signup();
    expect((await checkout(token, "free")).body.errors).toEqual(["Plano inexistente."]);
    expect((await checkout(token, "xx")).body.errors).toEqual(["Plano inexistente."]);
    expect((await checkout(token, "pro", "123")).body.errors).toEqual(["Número de cartão inválido."]);
    expect((await checkout(token, "pro", "4111111111110000")).body.errors).toEqual([DECLINED]);
    config.stripeSecretKey = "sk_test_x";
    expect((await checkout(token, "pro")).body.errors).toEqual(["Pagamento real habilitado: use o checkout do Stripe."]);
  });
});
