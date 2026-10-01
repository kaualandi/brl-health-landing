import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { config } from "../config";
import { db, schema } from "../db";
import { auth } from "../lib/auth";
import { checkoutErrors } from "./plans.rules";

const card = t.Object({ holder: t.String(), number: t.String(), expiry: t.String(), cvv: t.String() });

export const billingModule = new Elysia().use(auth).post(
  "/billing/checkout",
  async ({ userId, body, status }) => {
    const [plan] = await db.select().from(schema.plans).where(eq(schema.plans.id, body.planId));
    const errors = checkoutErrors(plan, body.card.number, !!config.stripeSecretKey);
    if (errors.length) return status(400, { errors });
    await db
      .insert(schema.subscriptions)
      .values({ userId, planId: body.planId })
      .onConflictDoUpdate({
        target: schema.subscriptions.userId,
        set: { planId: body.planId, status: "active" },
      });
    return { planId: body.planId, paidAt: new Date().toISOString() };
  },
  { auth: true, body: t.Object({ planId: t.String(), card }) },
);
