import { sql } from "drizzle-orm";
import { bigint, bigserial, boolean, date, foreignKey, index, integer, numeric, pgTable, primaryKey, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { exercises, users } from "./schema";

const textArray = (name: string) => text(name).array().notNull().default(sql`'{}'`);

export const fitProfiles = pgTable("fit_profiles", {
  userId: bigint("user_id", { mode: "number" })
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  goal: text("goal").notNull(),
  level: text("level").notNull(),
  daysPerWeek: integer("days_per_week").notNull(),
  location: text("location").notNull(),
  equipment: textArray("equipment"),
  sessionMinutes: integer("session_minutes").notNull(),
  limitations: textArray("limitations"),
});

export const fitPlans = pgTable("fit_plans", {
  userId: bigint("user_id", { mode: "number" })
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  seed: bigint("seed", { mode: "number" }).notNull(),
  split: text("split").notNull(),
  generatedAt: timestamp("generated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const fitPlanDays = pgTable(
  "fit_plan_days",
  {
    userId: bigint("user_id", { mode: "number" })
      .notNull()
      .references(() => fitPlans.userId, { onDelete: "cascade" }),
    dayIndex: integer("day_index").notNull(),
    name: text("name").notNull(),
    focus: textArray("focus"),
  },
  (t) => [primaryKey({ columns: [t.userId, t.dayIndex] })],
);

export const fitPlanExercises = pgTable(
  "fit_plan_exercises",
  {
    userId: bigint("user_id", { mode: "number" }).notNull(),
    dayIndex: integer("day_index").notNull(),
    order: integer("position").notNull(),
    exerciseId: text("exercise_id")
      .notNull()
      .references(() => exercises.id, { onDelete: "cascade" }),
    sets: integer("sets").notNull(),
    repsMin: integer("reps_min").notNull(),
    repsMax: integer("reps_max").notNull(),
    restSeconds: integer("rest_seconds").notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.dayIndex, t.order] }),
    foreignKey({ columns: [t.userId, t.dayIndex], foreignColumns: [fitPlanDays.userId, fitPlanDays.dayIndex] }).onDelete("cascade"),
  ],
);

export const fitSessions = pgTable(
  "fit_sessions",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    userId: bigint("user_id", { mode: "number" })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    clientId: uuid("client_id").notNull(),
    date: date("date", { mode: "string" }).notNull(),
    dayIndex: integer("day_index").notNull(),
    dayName: text("day_name").notNull(),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    durationSeconds: integer("duration_seconds"),
    kcal: integer("kcal"),
  },
  (t) => [unique("fit_sessions_user_client_uq").on(t.userId, t.clientId), index("fit_sessions_user_date_idx").on(t.userId, t.date)],
);

export const fitSessionSets = pgTable(
  "fit_session_sets",
  {
    sessionId: bigint("session_id", { mode: "number" })
      .notNull()
      .references(() => fitSessions.id, { onDelete: "cascade" }),
    exerciseId: text("exercise_id")
      .notNull()
      .references(() => exercises.id, { onDelete: "cascade" }),
    exerciseOrder: integer("exercise_order").notNull(),
    setNumber: integer("set_number").notNull(),
    weightKg: numeric("weight_kg", { precision: 6, scale: 2, mode: "number" }),
    reps: integer("reps").notNull(),
    done: boolean("done").notNull(),
  },
  (t) => [primaryKey({ columns: [t.sessionId, t.exerciseOrder, t.setNumber] })],
);
