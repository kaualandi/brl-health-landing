import { cors } from "@elysiajs/cors";
import { sql } from "drizzle-orm";
import { Elysia } from "elysia";
import { config } from "./config";
import { db } from "./db";
import { errors } from "./lib/errors";
import { catalogModule } from "./modules/catalog";
import { authModule } from "./modules/auth";

export const app = new Elysia()
  .use(errors)
  .use(cors({ origin: config.corsOrigin }))
  .use(catalogModule)
  .use(authModule)
  .get("/health", async () => {
    await db.execute(sql`select 1`);
    return { status: "ok" };
  });
