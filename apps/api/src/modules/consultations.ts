import { and, asc, eq } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { db, schema } from "../db";
import { auth } from "../lib/auth";
import { today } from "../lib/date";
import { isRealDate, scheduleErrors } from "./consultations.rules";

const { consultations, nutritionists, plans, subscriptions, users } = schema;
const scheduled = (userId: number) => and(eq(consultations.userId, userId), eq(consultations.status, "scheduled"));

async function creditsOf(userId: number) {
  const [row] = await db
    .select({ credits: plans.credits })
    .from(subscriptions)
    .innerJoin(plans, eq(plans.id, subscriptions.planId))
    .where(eq(subscriptions.userId, userId));
  return row?.credits ?? 1;
}

export const consultationsModule = new Elysia()
  .use(auth)
  .post(
    "/consultations",
    async ({ userId, body, status }) => {
      const { nutritionistId, date, time } = body;
      if (!isRealDate(date)) return status(400, { errors: ["Data inválida."] });
      const [mine, taken, credits] = await Promise.all([
        db.select({ id: consultations.id }).from(consultations).where(scheduled(userId)),
        db
          .select({ id: consultations.id })
          .from(consultations)
          .where(
            and(
              eq(consultations.nutritionistId, nutritionistId),
              eq(consultations.date, date),
              eq(consultations.time, time),
              eq(consultations.status, "scheduled"),
            ),
          ),
        creditsOf(userId),
      ]);
      const errors = scheduleErrors({
        nutritionistId,
        date,
        time,
        today: today(),
        activeCount: mine.length,
        credits,
        slotTaken: taken.length > 0,
      });
      if (errors.length) return status(400, { errors });
      const [row] = await db
        .insert(consultations)
        .values({ userId, nutritionistId, date, time })
        .returning({ id: consultations.id });
      return status(201, { id: row.id });
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
    { auth: true, params: t.Object({ id: t.Numeric() }) },
  );
