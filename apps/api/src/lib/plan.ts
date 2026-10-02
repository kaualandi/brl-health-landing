import { eq } from "drizzle-orm";
import { Elysia } from "elysia";
import { db, schema } from "../db";
import { auth } from "./auth";

export type PlanId = "free" | "pro" | "family";

/** Plano do usuário (sem assinatura = free). Fonte única das regras de acesso por plano. */
export async function planOf(userId: number): Promise<PlanId> {
  const [row] = await db
    .select({ id: schema.plans.id })
    .from(schema.subscriptions)
    .innerJoin(schema.plans, eq(schema.plans.id, schema.subscriptions.planId))
    .where(eq(schema.subscriptions.userId, userId));
  return (row?.id as PlanId | undefined) ?? "free";
}

/** Rota com `{ tier: true }` implica `auth` e recebe `plan` e `paid` (pro/family) no contexto. */
export const tier = new Elysia({ name: "tier" }).use(auth).macro({
  tier: {
    auth: true,
    async resolve(ctx) {
      // `auth: true` acima resolve antes e injeta userId (o tipo da macro não enxerga)
      const plan = await planOf((ctx as unknown as { userId: number }).userId);
      return { plan, paid: plan !== "free" };
    },
  },
});
