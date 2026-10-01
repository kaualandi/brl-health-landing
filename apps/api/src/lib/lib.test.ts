import { describe, expect, it } from "bun:test";
import { Elysia, t } from "elysia";
import { today } from "./date";
import { errors } from "./errors";
import { rateLimit } from "./rate-limit";

describe("today", () => {
  it("usa o fuso de São Paulo, não UTC", () => {
    // 02:30 UTC do dia 2 = 23:30 do dia 1 em São Paulo
    expect(today(new Date("2026-03-02T02:30:00Z"))).toBe("2026-03-01");
  });
});

describe("rateLimit", () => {
  it("bloqueia com 429 mesmo trocando x-forwarded-for (trustProxy desligado)", async () => {
    const app = new Elysia().use(rateLimit("test", 2, 60_000, false)).get("/", () => "ok");
    const hit = (ip: string) =>
      app.handle(new Request("http://localhost/", { headers: { "x-forwarded-for": ip } }));
    expect((await hit("1.1.1.1")).status).toBe(200);
    expect((await hit("2.2.2.2")).status).toBe(200);
    const blocked = await hit("3.3.3.3");
    expect(blocked.status).toBe(429);
    expect(await blocked.json()).toHaveProperty("error");
  });
});

describe("errors", () => {
  it("validação vira 400 { errors: string[] }", async () => {
    const app = new Elysia().use(errors).post("/", () => "ok", { body: t.Object({ email: t.String() }) });
    const res = await app.handle(
      new Request("http://localhost/", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{}",
      }),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(Array.isArray(body.errors)).toBe(true);
    expect(body.errors.length).toBeGreaterThan(0);
  });
});
