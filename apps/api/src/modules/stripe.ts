import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";
import type Stripe from "stripe";
import { config } from "../config";
import { db, schema } from "../db";
import { auth } from "../lib/auth";
import { getStripe } from "../lib/stripe";

const { plans, subscriptions, users } = schema;
const NOT_CONFIGURED = { error: "Pagamento não configurado." };

const ALREADY_PAID = "Você já tem uma assinatura paga. Gerencie pelo portal de pagamento.";

function providerError(status: (code: 502, body: { error: string }) => unknown, e: unknown) {
  console.error("[stripe]", e);
  return status(502, { error: "Não foi possível falar com o provedor de pagamento. Tente novamente." });
}

type Buyer = { email: string; customer: string | null } | undefined;

function sessionParams(userId: number, plan: { id: string; monthlyPrice: unknown }, buyer: Buyer) {
  const metadata = { userId: String(userId), planId: plan.id };
  return {
    mode: "subscription" as const,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "brl",
          unit_amount: Math.round(Number(plan.monthlyPrice) * 100),
          recurring: { interval: "month" as const },
          product_data: { name: `BRL Health — plano ${plan.id}` },
        },
      },
    ],
    metadata,
    subscription_data: { metadata },
    ...(buyer?.customer ? { customer: buyer.customer } : { customer_email: buyer?.email }),
    success_url: `${config.corsOrigin}/conta?checkout=success`,
    cancel_url: `${config.corsOrigin}/precos?checkout=cancel`,
  };
}

async function activate(session: Stripe.Checkout.Session) {
  const userId = Number(session.metadata?.userId);
  const planId = session.metadata?.planId;
  if (!userId || !planId) return;
  const [[plan], [user]] = await Promise.all([
    db.select({ id: plans.id }).from(plans).where(eq(plans.id, planId)),
    db.select({ id: users.id }).from(users).where(eq(users.id, userId)),
  ]);
  if (!plan || planId === "free" || !user) return console.error("[stripe] evento ignorado", { userId, planId });
  const customer = typeof session.customer === "string" ? session.customer : (session.customer?.id ?? null);
  const set = { planId, status: "active", hasPendingCharge: false, stripeCustomerId: customer };
  await db.insert(subscriptions).values({ userId, ...set }).onConflictDoUpdate({ target: subscriptions.userId, set });
}

async function cancel(sub: Stripe.Subscription) {
  const customer = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  await db
    .update(subscriptions)
    .set({ planId: "free", status: "active", hasPendingCharge: false })
    .where(eq(subscriptions.stripeCustomerId, customer));
}

export const stripeModule = new Elysia({ prefix: "/billing/stripe" })
  .use(auth)
  .get("/config", () => ({
    publishableKey: config.stripePublishableKey ?? "",
    configured: !!config.stripeSecretKey,
  }))
  .post(
    "/checkout",
    async ({ userId, body, status }) => {
      const stripe = getStripe();
      if (!stripe) return status(501, NOT_CONFIGURED);
      const [plan] = await db.select().from(plans).where(eq(plans.id, body.planId));
      if (!plan || plan.id === "free") return status(400, { errors: ["Plano inválido para checkout."] });
      const [row] = await db
        .select({ email: users.email, customer: subscriptions.stripeCustomerId, rank: plans.rank })
        .from(users)
        .leftJoin(subscriptions, eq(subscriptions.userId, users.id))
        .leftJoin(plans, eq(plans.id, subscriptions.planId))
        .where(eq(users.id, userId));
      if (row?.customer && (row.rank ?? 0) > 0) return status(400, { errors: [ALREADY_PAID] });
      try {
        const session = await stripe.checkout.sessions.create(sessionParams(userId, plan, row));
        return { url: session.url, sessionId: session.id };
      } catch (e) {
        return providerError(status, e);
      }
    },
    { auth: true, body: t.Object({ planId: t.String() }) },
  )
  .post(
    "/portal",
    async ({ userId, status }) => {
      const stripe = getStripe();
      if (!stripe) return status(501, NOT_CONFIGURED);
      const [sub] = await db
        .select({ customer: subscriptions.stripeCustomerId })
        .from(subscriptions)
        .where(eq(subscriptions.userId, userId));
      if (!sub?.customer) return status(400, { errors: ["Nenhuma assinatura paga para gerenciar."] });
      try {
        const session = await stripe.billingPortal.sessions.create({
          customer: sub.customer,
          return_url: `${config.corsOrigin}/conta`,
        });
        return { url: session.url };
      } catch (e) {
        return providerError(status, e);
      }
    },
    { auth: true },
  )
  .post(
    "/webhook",
    async ({ request, status }) => {
      const stripe = getStripe();
      const secret = config.stripeWebhookSecret;
      if (!stripe || !secret) return status(501, NOT_CONFIGURED);
      let event: Stripe.Event;
      try {
        const signature = request.headers.get("stripe-signature") ?? "";
        event = await stripe.webhooks.constructEventAsync(await request.text(), signature, secret);
      } catch {
        return status(400, { error: "Assinatura do webhook inválida." });
      }
      if (event.type === "checkout.session.completed") await activate(event.data.object);
      else if (event.type === "customer.subscription.deleted") await cancel(event.data.object);
      return { received: true };
    },
    { parse: "none" },
  );
