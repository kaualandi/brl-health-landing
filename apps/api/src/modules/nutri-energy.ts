import { and, count, eq, isNotNull, sum } from "drizzle-orm";
import { Elysia } from "elysia";
import { db, schema } from "../db";
import { auth } from "../lib/auth";
import { today } from "../lib/date";
import { bmr, bonusKcal } from "../lib/energy";

const { fitSessions, fitProfiles, nutriProfiles } = schema;

/** Treinos do dia (fuso do app) e o bônus que entra na meta do Nutri — regra em lib/energy.ts. */
export const nutriEnergyModule = new Elysia({ prefix: "/nutri/today-energy" }).use(auth).get(
  "/",
  async ({ userId }) => {
    const date = today();
    const [agg] = await db
      .select({ n: count(), kcal: sum(fitSessions.kcal) })
      .from(fitSessions)
      .where(and(eq(fitSessions.userId, userId), eq(fitSessions.date, date), isNotNull(fitSessions.kcal)));
    const workoutKcal = Number(agg.kcal ?? 0);
    const [profile] = await db.select().from(nutriProfiles).where(eq(nutriProfiles.userId, userId));
    const [fit] = await db.select({ d: fitProfiles.daysPerWeek }).from(fitProfiles).where(eq(fitProfiles.userId, userId));
    const bonus = profile && workoutKcal > 0 ? bonusKcal(workoutKcal, { activity: profile.activity, bmr: bmr(profile), trainDays: fit?.d }) : 0;
    return { date, workoutKcal, bonusKcal: bonus, sessions: agg.n };
  },
  { auth: true },
);
