import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";
import type Stripe from "stripe";
import { config } from "../config";
import { db, schema } from "../db";
import { auth } from "../lib/auth";
import { getStripe } from "../lib/stripe";

const { plans, subscriptions, users } = schema;
const NOT_CONFIGURED = { error: "Pagamento não configurado." };

async function activate(session: Stripe.Checkout.Session) {
  const userId = Number(session.metadata?.userId);
  const planId = session.metadata?.planId;
  if (!userId || !planId) return;
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
      const [user] = await db.select({ email: users.email }).from(users).where(eq(users.id, userId));
      const metadata = { userId: String(userId), planId: plan.id };
      try {
        const session = await stripe.checkout.sessions.create({
          mode: "subscription",
          line_items: [
            {
              quantity: 1,
              price_data: {
                currency: "brl",
                unit_amount: Math.round(Number(plan.monthlyPrice) * 100),
                recurring: { interval: "month" },
                product_data: { name: `BRL Health — plano ${plan.id}` },
              },
            },
          ],
          metadata,
          subscription_data: { metadata },
          customer_email: user?.email,
          success_url: `${config.corsOrigin}/conta?checkout=success`,
          cancel_url: `${config.corsOrigin}/precos?checkout=cancel`,
        });
        return { url: session.url, sessionId: session.id };
      } catch (e) {
        return status(502, { error: (e as Error).message });
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
        return status(502, { error: (e as Error).message });
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
