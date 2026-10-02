import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { db, schema } from "../db";
import { auth } from "../lib/auth";

// Lista pública e fixa de equipamentos do ExerciseDB v1 (valores crus).
export const FIT_EQUIPMENT = [
  "ab wheel", "assisted", "barbell", "bodyweight", "bosu ball", "cable", "dumbbell", "elliptical machine",
  "EZ bar", "hammer", "kettlebell", "leverage machine", "medicine ball", "olympic barbell",
  "resistance band", "roller", "rope", "sled machine", "ski ergometer", "smith machine", "stability ball",
  "stationary bike", "stepmill machine", "suspension trainer", "tennis ball", "tire", "towel", "trap bar",
  "upper body ergometer", "weighted",
] as const;

export const FIT_LIMITATIONS = ["knee", "shoulder", "lower_back", "wrist", "hip", "none"] as const;

const oneOf = <T extends string>(values: readonly T[], error: string) =>
  t.Union(values.map((v) => t.Literal(v)), { error });

const fitBody = t.Object({
  goal: oneOf(["hypertrophy", "strength", "fatloss", "health"], "Objetivo inválido."),
  level: oneOf(["beginner", "intermediate", "advanced"], "Nível inválido."),
  daysPerWeek: t.Integer({ minimum: 2, maximum: 6, error: "Dias por semana deve ser um inteiro entre 2 e 6." }),
  location: oneOf(["home", "gym"], "Local inválido."),
  equipment: t.Array(oneOf(FIT_EQUIPMENT, "Equipamento desconhecido."), { error: "Equipamentos inválidos." }),
  sessionMinutes: t.Integer({ minimum: 20, maximum: 120, error: "Duração da sessão deve estar entre 20 e 120 minutos." }),
  limitations: t.Array(oneOf(FIT_LIMITATIONS, "Limitação inválida."), { error: "Limitações inválidas." }),
});

const toResponse = ({ userId, ...p }: typeof schema.fitProfiles.$inferSelect) => p;

export const fitProfileModule = new Elysia({ prefix: "/fit/profile" })
  .use(auth)
  .get(
    "/",
    async ({ userId, status }) => {
      const [row] = await db.select().from(schema.fitProfiles).where(eq(schema.fitProfiles.userId, userId));
      return row ? toResponse(row) : status(404, { error: "Perfil de treino não encontrado" });
    },
    { auth: true },
  )
  .put(
    "/",
    async ({ userId, body, status }) => {
      if (body.location === "home" && body.equipment.length === 0) {
        return status(400, { errors: ["Treino em casa precisa de ao menos um equipamento (ex.: peso corporal)."] });
      }
      const [row] = await db
        .insert(schema.fitProfiles)
        .values({ userId, ...body })
        .onConflictDoUpdate({ target: schema.fitProfiles.userId, set: body })
        .returning();
      return toResponse(row);
    },
    { auth: true, body: fitBody },
  );
