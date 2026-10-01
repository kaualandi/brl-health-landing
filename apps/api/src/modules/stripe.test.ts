import { afterEach, describe, expect, it } from "bun:test";
import Stripe from "stripe";
import { config } from "../config";
import { api } from "../test/http";
import { signup } from "../test/users";
import { app } from "../app";

const original = { ...config };
afterEach(() => Object.assign(config, original));

const SECRET = "whsec_test";
const event = (type: string, object: object) => JSON.stringify({ id: "evt_1", object: "event", type, data: { object } });
const hook = async (payload: string, signature?: string) => {
  const stripe = new Stripe("sk_test_x");
  const sig = signature ?? await stripe.webhooks.generateTestHeaderStringAsync({ payload, secret: SECRET });
  return app.handle(
    new Request("http://localhost/billing/stripe/webhook", {
      method: "POST",
      headers: { "stripe-signature": sig, "content-type": "application/json" },
      body: payload,
    }),
  );
};

describe("stripe", () => {
  it("config reflete as chaves", async () => {
    config.stripeSecretKey = undefined;
    config.stripePublishableKey = undefined;
    expect((await api("GET", "/billing/stripe/config")).body).toEqual({ publishableKey: "", configured: false });
    config.stripeSecretKey = "sk_test_x";
    config.stripePublishableKey = "pk_test_x";
    expect((await api("GET", "/billing/stripe/config")).body).toEqual({ publishableKey: "pk_test_x", configured: true });
  });

  it("501 sem chave e 400 de plano inválido antes do Stripe", async () => {
    const { token } = await signup();
    config.stripeSecretKey = undefined;
    expect((await api("POST", "/billing/stripe/checkout", { planId: "pro" }, token)).status).toBe(501);
    expect((await api("POST", "/billing/stripe/portal", {}, token)).status).toBe(501);
    config.stripeSecretKey = "sk_test_x";
    for (const planId of ["free", "nope"]) {
      const res = await api("POST", "/billing/stripe/checkout", { planId }, token);
      expect(res.status).toBe(400);
      expect(res.body).toEqual({ errors: ["Plano inválido para checkout."] });
    }
    const portal = await api("POST", "/billing/stripe/portal", {}, token);
    expect(portal.body).toEqual({ errors: ["Nenhuma assinatura paga para gerenciar."] });
  });

  it("webhook: valida assinatura, ativa o plano e cancela de volta pra free", async () => {
    config.stripeSecretKey = "sk_test_x";
    config.stripeWebhookSecret = SECRET;
    const { token, user } = await signup();
    const done = event("checkout.session.completed", {
      id: "cs_1",
      object: "checkout.session",
      customer: "cus_test_1",
      metadata: { userId: user.id, planId: "pro" },
    });
    expect((await hook(done, "t=1,v1=bad")).status).toBe(400);
    for (let i = 0; i < 2; i++) expect((await hook(done)).status).toBe(200);
    expect((await api("GET", "/me/subscription", undefined, token)).body.planId).toBe("pro");
    const gone = event("customer.subscription.deleted", { id: "sub_1", object: "subscription", customer: "cus_test_1" });
    expect((await hook(gone)).status).toBe(200);
    expect((await api("GET", "/me/subscription", undefined, token)).body.planId).toBe("free");
  });

  it("webhook ignora plano desconhecido e usuário apagado com 200", async () => {
    config.stripeSecretKey = "sk_test_x";
    config.stripeWebhookSecret = SECRET;
    const { token, user } = await signup();
    const session = (userId: string, planId: string) =>
      event("checkout.session.completed", { id: "cs_2", object: "checkout.session", customer: "cus_2", metadata: { userId, planId } });
    expect((await hook(session(user.id, "nope"))).status).toBe(200);
    expect((await hook(session(user.id, "free"))).status).toBe(200);
    expect((await hook(session("999999999", "pro"))).status).toBe(200);
    expect((await api("GET", "/me/subscription", undefined, token)).body.planId).toBe("free");
  });

  it("checkout recusa quem já tem assinatura paga, antes de chamar o Stripe", async () => {
    config.stripeSecretKey = "sk_test_x";
    config.stripeWebhookSecret = SECRET;
    const { token, user } = await signup();
    const done = event("checkout.session.completed", {
      id: "cs_3", object: "checkout.session", customer: "cus_3", metadata: { userId: user.id, planId: "pro" },
    });
    await hook(done);
    const res = await api("POST", "/billing/stripe/checkout", { planId: "family" }, token);
    expect(res.status).toBe(400);
    expect(res.body.errors[0]).toContain("já tem uma assinatura paga");
  });

  it("webhook sem secret responde 501", async () => {
    config.stripeSecretKey = "sk_test_x";
    config.stripeWebhookSecret = undefined;
    expect((await hook("{}", "x")).status).toBe(501);
  });
});
