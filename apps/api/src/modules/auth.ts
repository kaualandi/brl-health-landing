import { and, eq, gt, isNull } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { config } from "../config";
import { db, schema } from "../db";
import { jwtPlugin } from "../lib/auth";
import { sendVerificationCode } from "./account";
import { rateLimit } from "../lib/rate-limit";

const REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const EXPIRED = { error: "Sessão expirada. Faça login novamente." };
const normalize = (email: string) => email.trim().toLowerCase();
const sha256 = (value: string) => new Bun.CryptoHasher("sha256").update(value).digest("hex");

const DUMMY_HASH = await Bun.password.hash("dummy-password", { algorithm: "bcrypt" });
const credentials = t.Object({ email: t.String(), password: t.String() });
const registration = t.Object({ name: t.String(), email: t.String(), password: t.String() });
const refreshBody = t.Object({ refreshToken: t.String() });

function registerErrors(b: { name: string; email: string; password: string }) {
  const list: string[] = [];
  if (!b.name.trim()) list.push("Informe seu nome.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalize(b.email))) list.push("E-mail inválido.");
  if (b.password.length < 6) list.push("A senha deve ter ao menos 6 caracteres.");
  return list;
}

export const authModule = new Elysia({ prefix: "/auth" })
  .use(rateLimit("auth", config.authRateLimit))
  .use(jwtPlugin)
  .resolve(({ jwt }) => ({
    async issue(user: { id: number; name: string; email: string }) {
      const refreshToken = Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString("base64url");
      await db.insert(schema.refreshTokens).values({
        userId: user.id,
        tokenHash: sha256(refreshToken),
        expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
      });
      const token = await jwt.sign({ sub: String(user.id) });
      return { user: { id: String(user.id), name: user.name, email: user.email }, token, refreshToken };
    },
  }))
  .post(
    "/login",
    async ({ body, issue, status }) => {
      const email = normalize(body.email);
      if (!email || !body.password) return status(400, { errors: ["Informe e-mail e senha."] });
      const [user] = await db.select().from(schema.users).where(eq(schema.users.email, email));
      // e-mail inexistente verifica um hash fictício: mesmo tempo de resposta
      const ok = await Bun.password.verify(body.password, user?.passwordHash ?? DUMMY_HASH);
      if (!user || !ok) return status(401, { error: "Credenciais inválidas" });
      return issue(user);
    },
    { body: credentials },
  )
  .post(
    "/register",
    async ({ body, issue, status }) => {
      const errors = registerErrors(body);
      if (errors.length) return status(400, { errors });
      const email = normalize(body.email);
      const passwordHash = await Bun.password.hash(body.password, { algorithm: "bcrypt" });
      const user = await db.transaction(async (tx) => {
        const [created] = await tx
          .insert(schema.users)
          .values({ name: body.name.trim(), email, passwordHash })
          .onConflictDoNothing()
          .returning();
        if (created) await tx.insert(schema.subscriptions).values({ userId: created.id, planId: "free" });
        return created;
      });
      if (!user) return status(400, { errors: ["E-mail já cadastrado."] });
      // o front leva direto pra "confirme seu e-mail": o código já sai no cadastro
      await sendVerificationCode(user);
      return status(201, await issue(user));
    },
    { body: registration },
  )
  .post(
    "/refresh",
    async ({ body, issue, status }) => {
      const now = new Date();
      const [revoked] = await db
        .update(schema.refreshTokens)
        .set({ revokedAt: now })
        .where(
          and(
            eq(schema.refreshTokens.tokenHash, sha256(body.refreshToken)),
            isNull(schema.refreshTokens.revokedAt),
            gt(schema.refreshTokens.expiresAt, now),
          ),
        )
        .returning({ userId: schema.refreshTokens.userId });
      if (!revoked) return status(401, EXPIRED);
      const [user] = await db.select().from(schema.users).where(eq(schema.users.id, revoked.userId));
      if (!user) return status(401, EXPIRED);
      return issue(user);
    },
    { body: refreshBody },
  )
  .post(
    "/logout",
    async ({ body }) => {
      if (body?.refreshToken) {
        await db
          .update(schema.refreshTokens)
          .set({ revokedAt: new Date() })
          .where(and(eq(schema.refreshTokens.tokenHash, sha256(body.refreshToken)), isNull(schema.refreshTokens.revokedAt)));
      }
      return { message: "Sessão encerrada" };
    },
    { body: t.Optional(t.Object({ refreshToken: t.Optional(t.String()) })) },
  );
