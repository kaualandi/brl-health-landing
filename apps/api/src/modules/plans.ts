import { asc, eq } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { config } from "../config";
import { db, schema } from "../db";
import { auth } from "../lib/auth";
import { planChangeErrors } from "./plans.rules";

const { plans, subscriptions } = schema;
const FREE = { planId: "free", credits: 1, hasPendingCharge: false };

export const plansModule = new Elysia()
  .use(auth)
  .get("/plans", () =>
    db
      .select({ id: plans.id, monthlyPrice: plans.monthlyPrice, credits: plans.credits })
      .from(plans)
      .orderBy(asc(plans.rank)),
  )
  .get(
    "/me/subscription",
    async ({ userId }) => {
      const [row] = await db
        .select({ planId: plans.id, credits: plans.credits, hasPendingCharge: subscriptions.hasPendingCharge })
        .from(subscriptions)
        .innerJoin(plans, eq(plans.id, subscriptions.planId))
        .where(eq(subscriptions.userId, userId));
      return row ?? FREE;
    },
    { auth: true },
  )
  .put(
    "/me/plan",
    async ({ userId, body, status }) => {
      const [target] = await db.select().from(plans).where(eq(plans.id, body.target));
      const [cur] = await db
        .select({ id: plans.id, rank: plans.rank, pending: subscriptions.hasPendingCharge })
        .from(subscriptions)
        .innerJoin(plans, eq(plans.id, subscriptions.planId))
        .where(eq(subscriptions.userId, userId));
      const errors = planChangeErrors({
        target,
        current: cur ?? { id: "free", rank: 0 },
        cardNumber: body.cardNumber,
        hasPendingCharge: cur?.pending ?? false,
        stripeEnabled: !!config.stripeSecretKey,
      });
      if (errors.length) return status(400, { errors });
      await db
        .insert(subscriptions)
        .values({ userId, planId: body.target })
        .onConflictDoUpdate({ target: subscriptions.userId, set: { planId: body.target, status: "active" } });
      return { plan: body.target };
    },
    { auth: true, body: t.Object({ target: t.String(), cardNumber: t.Optional(t.String()) }) },
  );
