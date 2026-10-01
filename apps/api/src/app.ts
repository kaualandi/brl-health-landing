import { cors } from "@elysiajs/cors";
import { sql } from "drizzle-orm";
import { Elysia } from "elysia";
import { config } from "./config";
import { db } from "./db";
import { errors } from "./lib/errors";

export const app = new Elysia()
  .use(errors)
  .use(cors({ origin: config.corsOrigin }))
  .get("/health", async () => {
    await db.execute(sql`select 1`);
    return { status: "ok" };
  });
