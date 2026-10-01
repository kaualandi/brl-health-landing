import { expect, it } from "bun:test";
import { sql } from "drizzle-orm";
import { db } from ".";
import { api } from "../test/http";
import { signup } from "../test/users";

it("grava jsonb como objeto, não como string JSON", async () => {
  const { token, user } = await signup();
  await api("POST", "/nutri/habits", { done: { water: true } }, token);
  const [row] = await db.execute<{ t: string }>(
    sql`select jsonb_typeof(done) as t from habit_logs where user_id = ${Number(user.id)}`,
  );
  expect(row.t).toBe("object");
});
