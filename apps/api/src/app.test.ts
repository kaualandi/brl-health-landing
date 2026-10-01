import { describe, expect, it } from "bun:test";
import { api } from "./test/http";

describe("app", () => {
  it("GET /health responde ok com o banco de pé", async () => {
    const res = await api("GET", "/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });

  it("rota inexistente responde 404 no formato { error }", async () => {
    const res = await api("GET", "/nao-existe");
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("error");
  });
});
