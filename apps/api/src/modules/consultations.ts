import { and, asc, eq, sql } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { db, schema } from "../db";
import { auth } from "../lib/auth";
import { today } from "../lib/date";
import { isRealDate, scheduleErrors, type ScheduleContext } from "./consultations.rules";

const { consultations, nutritionists, plans, subscriptions, users } = schema;
const scheduled = (userId: number) => and(eq(consultations.userId, userId), eq(consultations.status, "scheduled"));

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type Booking = { nutritionistId: string; date: string; time: string };

async function creditsOf(tx: Tx, userId: number) {
  const [row] = await tx
    .select({ credits: plans.credits })
    .from(subscriptions)
    .innerJoin(plans, eq(plans.id, subscriptions.planId))
    .where(eq(subscriptions.userId, userId));
  return row?.credits ?? 1;
}

/** Trava usuário e slot (ordem fixa, sem deadlock) e monta o contexto das regras. */
async function scheduleContext(tx: Tx, userId: number, b: Booking): Promise<ScheduleContext> {
  await tx.execute(sql`select pg_advisory_xact_lock(hashtext('consult:user:' || ${userId}))`);
  await tx.execute(
    sql`select pg_advisory_xact_lock(hashtext('consult:slot:' || ${b.nutritionistId} || ${b.date} || ${b.time}))`,
  );
  const mine = await tx.select({ id: consultations.id }).from(consultations).where(scheduled(userId));
  const taken = await tx
    .select({ id: consultations.id })
    .from(consultations)
    .where(
      and(
        eq(consultations.nutritionistId, b.nutritionistId),
        eq(consultations.date, b.date),
        eq(consultations.time, b.time),
        eq(consultations.status, "scheduled"),
      ),
    );
  const credits = await creditsOf(tx, userId);
  return { ...b, today: today(), activeCount: mine.length, credits, slotTaken: taken.length > 0 };
}

export const consultationsModule = new Elysia()
  .use(auth)
  .post(
    "/consultations",
    async ({ userId, body, status }) => {
      if (!isRealDate(body.date)) return status(400, { errors: ["Data inválida."] });
      return db.transaction(async (tx) => {
        const errors = scheduleErrors(await scheduleContext(tx, userId, body));
        if (errors.length) return status(400, { errors });
        const [row] = await tx
          .insert(consultations)
          .values({ userId, ...body })
          .returning({ id: consultations.id });
        return status(201, { id: row.id });
      });
    },
    {
      auth: true,
      body: t.Object({
        nutritionistId: t.String(),
        date: t.String({ pattern: "^\\d{4}-\\d{2}-\\d{2}$" }),
        time: t.String({ pattern: "^\\d{2}:\\d{2}$" }),
      }),
    },
  )
  .get(
    "/consultations/me",
    ({ userId }) =>
      db
        .select({
          id: consultations.id,
          nutritionistId: consultations.nutritionistId,
          date: consultations.date,
          time: consultations.time,
          nutritionistName: nutritionists.name,
          nutritionistFocus: nutritionists.focus,
          crn: nutritionists.crn,
          userName: users.name,
        })
        .from(consultations)
        .innerJoin(nutritionists, eq(nutritionists.id, consultations.nutritionistId))
        .innerJoin(users, eq(users.id, consultations.userId))
        .where(scheduled(userId))
        .orderBy(asc(consultations.date), asc(consultations.time)),
    { auth: true },
  )
  .delete(
    "/consultations/:id",
    async ({ userId, params, status }) => {
      const [row] = await db
        .update(consultations)
        .set({ status: "cancelled" })
        .where(and(eq(consultations.id, params.id), scheduled(userId)))
        .returning({ id: consultations.id });
      return row ? status(204, undefined) : status(404, { error: "Consulta não encontrada" });
    },
    { auth: true, params: t.Object({ id: t.Numeric({ maximum: 2147483647 }) }) },
  );
