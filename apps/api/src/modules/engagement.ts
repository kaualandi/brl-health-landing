import { Elysia, t } from "elysia";
import { db, schema } from "../db";
import { rateLimit } from "../lib/rate-limit";

const email = t.String({ format: "email", error: "E-mail inválido" });

// rotas públicas: limite por IP contra spam; analytics tem cota própria (page_view por rota)
const forms = new Elysia()
  .use(rateLimit("engagement", 30))
  .post(
    "/contact",
    async ({ body, status }) => {
      const [row] = await db.insert(schema.contactMessages).values(body).returning({ id: schema.contactMessages.id });
      return status(201, { id: String(row.id) });
    },
    {
      body: t.Object({
        name: t.String({ minLength: 2, error: "Informe seu nome (mínimo 2 caracteres)" }),
        email,
        subject: t.Union(
          [t.Literal("duvida"), t.Literal("sugestao"), t.Literal("parceria"), t.Literal("outro")],
          { error: "Assunto inválido" },
        ),
        message: t.String({ minLength: 10, maxLength: 500, error: "A mensagem deve ter entre 10 e 500 caracteres" }),
      }),
    },
  )
  .post(
    "/waitlist",
    async ({ body }) => {
      await db
        .insert(schema.waitlist)
        .values({ email: body.email.trim().toLowerCase(), source: body.source ?? "fit" })
        .onConflictDoNothing({ target: schema.waitlist.email });
      return { joined: true };
    },
    {
      body: t.Object({
        email,
        source: t.Optional(t.Union([t.Literal("fit"), t.Literal("newsletter")], { error: "Origem inválida" })),
      }),
    },
  );

const analytics = new Elysia()
  .use(rateLimit("analytics", 120))
  .post(
    "/analytics/events",
    async ({ body, status }) => {
      await db.insert(schema.analyticsEvents).values({ event: body.event, props: body.props ?? null });
      return status(202, {});
    },
    {
      body: t.Object({
        event: t.String({ minLength: 1, error: "Evento obrigatório" }),
        props: t.Optional(t.Record(t.String(), t.Union([t.String(), t.Number(), t.Boolean(), t.Null()]))),
      }),
    },
  );

export const engagementModule = new Elysia().use(forms).use(analytics);