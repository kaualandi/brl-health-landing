import { sql } from "drizzle-orm";
import {
  bigint,
  bigserial,
  boolean,
  date,
  index,
  integer,
  customType,
  numeric,
  pgTable,
  type PgColumnBuilderBase,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";

// jsonb do pg-core faz JSON.stringify e o driver bun-sql serializa de novo: grava string em vez de objeto
const jsonb = customType<{ data: unknown; driverData: unknown }>({
  dataType: () => "jsonb",
  toDriver: (value) => value,
  fromDriver: (value) => (typeof value === "string" ? JSON.parse(value) : value),
});
const emptyArray = sql`'[]'::jsonb`;
const emptyObject = sql`'{}'::jsonb`;

const id = () => bigserial("id", { mode: "number" }).primaryKey();
const userId = () =>
  bigint("user_id", { mode: "number" })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" });
const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const num = (name: string, precision: number, scale: number) =>
  numeric(name, { precision, scale, mode: "number" });
const textArray = (name: string) => text(name).array().notNull().default(sql`'{}'`);

export const users = pgTable("users", {
  id: id(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  emailVerified: boolean("email_verified").notNull().default(false),
  createdAt: createdAt(),
});

export const nutriProfiles = pgTable("nutri_profiles", {
  userId: bigint("user_id", { mode: "number" })
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  sex: text("sex").notNull(),
  age: integer("age").notNull(),
  heightCm: num("height_cm", 5, 1).notNull(),
  weightKg: num("weight_kg", 5, 1).notNull(),
  targetKg: num("target_kg", 5, 1),
  goal: text("goal").notNull(),
  activity: text("activity").notNull(),
  diet: text("diet").notNull(),
  restrictions: textArray("restrictions"),
  mealsPerDay: integer("meals_per_day").notNull().default(3),
  waterGlasses: integer("water_glasses").notNull().default(8),
  meals: jsonb("meals").$type<{ name: string; time: string }[]>().notNull().default(emptyArray),
  wakeTime: text("wake_time"),
  trainTime: text("train_time"),
  sleepTime: text("sleep_time"),
});

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

export const plans = pgTable("plans", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  monthlyPrice: num("monthly_price", 8, 2).notNull(),
  rank: integer("rank").notNull(),
  credits: integer("credits").notNull(),
});

export const subscriptions = pgTable("subscriptions", {
  id: id(),
  userId: userId().unique(),
  planId: text("plan_id")
    .notNull()
    .references(() => plans.id),
  status: text("status").notNull().default("active"),
  hasPendingCharge: boolean("has_pending_charge").notNull().default(false),
  currentPeriodEnd: date("current_period_end"),
  stripeCustomerId: text("stripe_customer_id"),
  createdAt: createdAt(),
});

export const nutritionists = pgTable("nutritionists", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  crn: text("crn").notNull(),
  focus: text("focus").notNull(),
  bio: text("bio"),
  rating: num("rating", 2, 1),
  reviews: integer("reviews"),
  years: integer("years"),
  avatar: text("avatar"),
  goals: textArray("goals"),
  diets: textArray("diets"),
});

export const consultations = pgTable(
  "consultations",
  {
    id: id(),
    userId: userId(),
    nutritionistId: text("nutritionist_id")
      .notNull()
      .references(() => nutritionists.id),
    date: date("date").notNull(),
    time: text("time").notNull(),
    status: text("status").notNull().default("scheduled"),
    createdAt: createdAt(),
  },
  (t) => [index("ix_consultations_user").on(t.userId, t.date, t.time)],
);

export const foods = pgTable("foods", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  emoji: text("emoji"),
  role: text("role").notNull(),
  portion: text("portion").notNull(),
  kcal: integer("kcal").notNull(),
  protein: integer("protein").notNull(),
  carb: integer("carb").notNull(),
  fat: integer("fat").notNull(),
  diets: textArray("diets"),
  excludedBy: textArray("excluded_by"),
});

export const recipes = pgTable("recipes", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  emoji: text("emoji"),
  category: text("category").notNull(),
  excerpt: text("excerpt").notNull(),
  prepTime: text("prep_time").notNull(),
  kcal: integer("kcal").notNull(),
  protein: integer("protein").notNull(),
  carbs: integer("carbs").notNull(),
  fat: integer("fat").notNull(),
  servings: integer("servings").notNull().default(1),
  diet: text("diet").notNull(),
  goals: textArray("goals"),
  ingredients: textArray("ingredients"),
  steps: textArray("steps"),
  tags: textArray("tags"),
});

export type ArticleSection = { heading?: string; paragraphs?: string[]; bullets?: string[] };

export const articles = pgTable("articles", {
  id: text("id").primaryKey(),
  category: text("category").notNull(),
  emoji: text("emoji"),
  title: text("title").notNull(),
  excerpt: text("excerpt").notNull(),
  readTime: text("read_time").notNull(),
  author: text("author").notNull(),
  goals: textArray("goals"),
  body: jsonb("body").$type<ArticleSection[]>().notNull().default(emptyArray),
});

// Tracking diário: um registro por (user_id, date), upsert na escrita.
const daily = <T extends Record<string, PgColumnBuilderBase>>(
  name: string,
  cols: T,
) =>
  pgTable(
    name,
    { id: id(), userId: userId(), date: date("date").notNull(), ...cols },
    (t) => [unique().on(t.userId, t.date), index(`ix_${name}_user`).on(t.userId, t.date)],
  );

export const waterLogs = daily("water_logs", { ml: integer("ml").notNull().default(0) });
export const weightLogs = daily("weight_logs", { weightKg: num("weight_kg", 5, 1).notNull() });
export const sleepLogs = daily("sleep_logs", { hours: num("hours", 4, 1).notNull() });
export const stepLogs = daily("step_logs", { count: integer("count").notNull().default(0) });
export const measurements = daily("measurements", {
  waist: num("waist", 5, 1),
  hip: num("hip", 5, 1),
  chest: num("chest", 5, 1),
  arm: num("arm", 5, 1),
  thigh: num("thigh", 5, 1),
});
export const habitLogs = daily("habit_logs", {
  done: jsonb("done").$type<Record<string, boolean>>().notNull().default(emptyObject),
});
export const mealLogs = daily("meal_logs", {
  done: jsonb("done").$type<Record<string, boolean>>().notNull().default(emptyObject),
});

export const contactMessages = pgTable("contact_messages", {
  id: id(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  createdAt: createdAt(),
});

export const waitlist = pgTable("waitlist", {
  id: id(),
  email: text("email").notNull().unique(),
  source: text("source").notNull().default("fit"),
  createdAt: createdAt(),
});

export const analyticsEvents = pgTable("analytics_events", {
  id: id(),
  event: text("event").notNull(),
  props: jsonb("props").$type<Record<string, unknown>>(),
  createdAt: createdAt(),
});

export const refreshTokens = pgTable("refresh_tokens", {
  id: id(),
  userId: userId(),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  createdAt: createdAt(),
});

export const emailTokens = pgTable(
  "email_tokens",
  {
    id: id(),
    userId: userId(),
    purpose: text("purpose").notNull(), // 'reset' | 'verify'
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    consumedAt: timestamp("consumed_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [index("ix_email_tokens_lookup").on(t.purpose, t.tokenHash)],
);

export const exercises = pgTable(
  "exercises",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    gifUrl: text("gif_url").notNull(),
    mediaPath: text("media_path"),
    bodyParts: textArray("body_parts"),
    targetMuscles: textArray("target_muscles"),
    secondaryMuscles: textArray("secondary_muscles"),
    equipments: textArray("equipments"),
    instructions: textArray("instructions"),
    namePt: text("name_pt"),
    instructionsPt: text("instructions_pt").array(),
  },
  (t) => [index("ix_exercises_name").on(t.name)],
);
