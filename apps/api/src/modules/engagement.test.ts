import { describe, expect, it } from "bun:test";
import { eq } from "drizzle-orm";
import { db, schema } from "../db";
import { api } from "../test/http";

const uniqueEmail = () => `${crypto.randomUUID()}@test.com`;
const valid = { name: "Maria", email: "maria@test.com", subject: "duvida", message: "Mensagem de teste ok" };

describe("POST /contact", () => {
  it("cria e devolve id string", async () => {
    const res = await api("POST", "/contact", { ...valid, email: uniqueEmail() });
    expect(res.status).toBe(201);
    expect(typeof res.body.id).toBe("string");
  });

  it.each([
    ["nome curto", { name: "M" }],
    ["e-mail inválido", { email: "x" }],
    ["assunto inválido", { subject: "foo" }],
    ["mensagem curta", { message: "curta" }],
    ["mensagem longa", { message: "x".repeat(501) }],
  ])("400 com %s", async (_n, patch) => {
    const res = await api("POST", "/contact", { ...valid, ...patch });
    expect(res.status).toBe(400);
    expect(res.body.errors[0]).toMatch(/[a-zçãé]/i);
    expect(res.body.errors[0]).not.toMatch(/Expected|format/);
  });
});

describe("POST /waitlist", () => {
  it("é idempotente e normaliza o e-mail", async () => {
    const email = uniqueEmail();
    const a = await api("POST", "/waitlist", { email: email.toUpperCase() });
    const b = await api("POST", "/waitlist", { email });
    expect(a.status).toBe(200);
    expect(a.body).toEqual({ joined: true });
    expect(b.status).toBe(200);
    const rows = await db.select().from(schema.waitlist).where(eq(schema.waitlist.email, email));
    expect(rows).toHaveLength(1);
    expect(rows[0].source).toBe("fit");
  });

  it("400 com e-mail inválido ou source inválido", async () => {
    expect((await api("POST", "/waitlist", { email: "x" })).status).toBe(400);
    expect((await api("POST", "/waitlist", { email: uniqueEmail(), source: "x" })).body.errors).toBeArray();
  });
});

describe("POST /analytics/events", () => {
  it("202 e grava props", async () => {
    const event = `t-${crypto.randomUUID()}`;
    const res = await api("POST", "/analytics/events", { event, props: { a: 1, b: "x", c: true, d: null } });
    expect(res.status).toBe(202);
    const [row] = await db.select().from(schema.analyticsEvents).where(eq(schema.analyticsEvents.event, event));
    expect(row.props).toEqual({ a: 1, b: "x", c: true, d: null });
  });

  it("400 com evento vazio", async () => {
    expect((await api("POST", "/analytics/events", { event: "" })).status).toBe(400);
  });
});
