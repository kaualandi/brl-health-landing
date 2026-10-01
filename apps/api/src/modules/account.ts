import { and, eq, gt, isNull } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { config } from "../config";
import { db, schema } from "../db";
import { auth } from "../lib/auth";
import { sendEmail } from "../lib/email";
import { rateLimit } from "../lib/rate-limit";

const sha256 = (value: string) => new Bun.CryptoHasher("sha256").update(value).digest("hex");
const RESET_TTL_MS = 60 * 60 * 1000;
const VERIFY_TTL_MS = 15 * 60 * 1000;
const BAD_LINK = { errors: ["Link inválido ou expirado"] };

const saveToken = (userId: number, purpose: "reset" | "verify", token: string, ttl: number) =>
  db.insert(schema.emailTokens).values({
    userId,
    purpose,
    tokenHash: sha256(token),
    expiresAt: new Date(Date.now() + ttl),
  });

/** Consome (uma vez só) um token válido; devolve o userId ou undefined. */
async function consume(purpose: "reset" | "verify", token: string, userId?: number) {
  const now = new Date();
  const [row] = await db
    .update(schema.emailTokens)
    .set({ consumedAt: now })
    .where(
      and(
        eq(schema.emailTokens.purpose, purpose),
        eq(schema.emailTokens.tokenHash, sha256(token)),
        isNull(schema.emailTokens.consumedAt),
        gt(schema.emailTokens.expiresAt, now),
        userId ? eq(schema.emailTokens.userId, userId) : undefined,
      ),
    )
    .returning({ userId: schema.emailTokens.userId });
  return row?.userId;
}

export const accountModule = new Elysia()
  .use(rateLimit("account", config.authRateLimit))
  .use(auth)
  .post(
    "/auth/forgot",
    async ({ body }) => {
      const email = body.email.trim().toLowerCase();
      const [user] = await db.select().from(schema.users).where(eq(schema.users.email, email));
      if (user) {
        const token = Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString("base64url");
        await saveToken(user.id, "reset", token, RESET_TTL_MS);
        sendEmail({
          to: user.email,
          subject: "Redefinição de senha - BRL Health",
          text: `Para redefinir sua senha acesse: ${config.corsOrigin}/redefinir-senha?token=${token}\nO link vale por 1 hora.`,
        });
      }
      return { message: "Se houver uma conta, enviamos um link de redefinição." };
    },
    { body: t.Object({ email: t.String() }) },
  )
  .post(
    "/auth/reset",
    async ({ body, status }) => {
      if (body.password.length < 6) return status(400, { errors: ["A senha deve ter ao menos 6 caracteres."] });
      const userId = await consume("reset", body.token);
      if (!userId) return status(400, BAD_LINK);
      const passwordHash = await Bun.password.hash(body.password, { algorithm: "bcrypt" });
      await db.transaction(async (tx) => {
        await tx.update(schema.users).set({ passwordHash }).where(eq(schema.users.id, userId));
        await tx
          .update(schema.refreshTokens)
          .set({ revokedAt: new Date() })
          .where(and(eq(schema.refreshTokens.userId, userId), isNull(schema.refreshTokens.revokedAt)));
      });
      return { message: "Senha redefinida" };
    },
    { body: t.Object({ token: t.String(), password: t.String() }) },
  )
  .post(
    "/auth/verify/resend",
    async ({ userId }) => {
      const [user] = await db.select().from(schema.users).where(eq(schema.users.id, userId));
      if (user) {
        const code = String(crypto.getRandomValues(new Uint32Array(1))[0]! % 1_000_000).padStart(6, "0");
        await db
          .update(schema.emailTokens)
          .set({ consumedAt: new Date() })
          .where(
            and(
              eq(schema.emailTokens.userId, userId),
              eq(schema.emailTokens.purpose, "verify"),
              isNull(schema.emailTokens.consumedAt),
            ),
          );
        await saveToken(userId, "verify", code, VERIFY_TTL_MS);
        sendEmail({
          to: user.email,
          subject: "Código de verificação - BRL Health",
          text: `Seu código de verificação: ${code}\nEle vale por 15 minutos.`,
        });
      }
      return { message: "Enviamos um novo código para o seu e-mail." };
    },
    { auth: true },
  )
  .post(
    "/auth/verify",
    async ({ body, userId, status }) => {
      if (!/^\d{6}$/.test(body.code)) return status(400, { errors: ["Código inválido. Confira os 6 dígitos."] });
      if (!(await consume("verify", body.code, userId)))
        return status(400, { errors: ["Código inválido ou expirado. Solicite um novo."] });
      await db.update(schema.users).set({ emailVerified: true }).where(eq(schema.users.id, userId));
      return { message: "E-mail verificado" };
    },
    { auth: true, body: t.Object({ code: t.String() }) },
  )
  .delete(
    "/me/account",
    async ({ userId, status }) => {
      const [gone] = await db.delete(schema.users).where(eq(schema.users.id, userId)).returning({ id: schema.users.id });
      if (!gone) return status(404, { error: "Conta não encontrada" });
      return { message: "Conta e dados excluídos" };
    },
    { auth: true },
  );
