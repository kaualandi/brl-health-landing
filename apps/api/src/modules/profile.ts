import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { db, schema } from "../db";
import { auth } from "../lib/auth";

const oneOf = <T extends string>(values: readonly T[], error: string) =>
  t.Union(values.map((v) => t.Literal(v)), { error });
const time = (label: string) => t.String({ pattern: "^([01]\\d|2[0-3]):[0-5]\\d$", error: `${label} inválido (use HH:MM).` });
const optTime = (label: string) => t.Union([time(label), t.Null()], { error: `${label} inválido (use HH:MM).` });
const optNum = (min: number, max: number, error: string) =>
  t.Union([t.Number({ minimum: min, maximum: max }), t.Null()], { error });

const profileBody = t.Object({
  sex: oneOf(["male", "female"], "Sexo inválido."),
  age: t.Integer({ minimum: 10, maximum: 120, error: "Idade deve ser um inteiro entre 10 e 120." }),
  heightCm: t.Number({ minimum: 100, maximum: 250, error: "Altura deve estar entre 100 e 250 cm." }),
  weightKg: t.Number({ minimum: 20, maximum: 400, error: "Peso deve estar entre 20 e 400 kg." }),
  goalWeightKg: optNum(20, 400, "Peso-alvo deve estar entre 20 e 400 kg."),
  goal: oneOf(["lose", "recomp", "gain", "performance", "health"], "Objetivo inválido."),
  activity: oneOf(["sedentary", "light", "moderate", "active", "athlete"], "Nível de atividade inválido."),
  diet: oneOf(["omnivore", "vegetarian", "vegan", "lowcarb", "mediterranean"], "Dieta inválida."),
  restrictions: t.Array(oneOf(["lactose", "gluten", "nuts", "seafood", "egg", "none"], "Restrição inválida."), {
    error: "Restrições inválidas.",
  }),
  mealsPerDay: t.Integer({ minimum: 1, maximum: 8, error: "Refeições por dia deve estar entre 1 e 8." }),
  waterGlasses: t.Integer({ minimum: 0, maximum: 30, error: "Copos de água deve estar entre 0 e 30." }),
  meals: t.Array(t.Object({ name: t.String(), time: time("Horário da refeição") }), { error: "Refeições inválidas." }),
  wakeTime: optTime("Horário de acordar"),
  trainTime: optTime("Horário de treino"),
  sleepTime: optTime("Horário de dormir"),
});

const toResponse = ({ userId, targetKg, ...p }: typeof schema.nutriProfiles.$inferSelect) => ({
  ...p,
  goalWeightKg: targetKg,
});

export const profileModule = new Elysia({ prefix: "/nutri/profile" })
  .use(auth)
  .get(
    "/",
    async ({ userId, status }) => {
      const [row] = await db.select().from(schema.nutriProfiles).where(eq(schema.nutriProfiles.userId, userId));
      return row ? toResponse(row) : status(404, { error: "Perfil não encontrado" });
    },
    { auth: true },
  )
  .put(
    "/",
    async ({ userId, body }) => {
      const { goalWeightKg, ...rest } = body;
      const values = { ...rest, targetKg: goalWeightKg };
      const [row] = await db
        .insert(schema.nutriProfiles)
        .values({ userId, ...values })
        .onConflictDoUpdate({ target: schema.nutriProfiles.userId, set: values })
        .returning();
      return toResponse(row);
    },
    { auth: true, body: profileBody },
  );
