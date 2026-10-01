import { cors } from "@elysiajs/cors";
import { sql } from "drizzle-orm";
import { Elysia } from "elysia";
import { config } from "./config";
import { db } from "./db";
import { errors } from "./lib/errors";
import { catalogModule } from "./modules/catalog";
import { authModule } from "./modules/auth";
import { engagementModule } from "./modules/engagement";
import { billingModule } from "./modules/billing";
import { plansModule } from "./modules/plans";
import { profileModule } from "./modules/profile";

export const app = new Elysia()
  .use(errors)
  .use(cors({ origin: config.corsOrigin }))
  .use(catalogModule)
  .use(authModule)
  .use(engagementModule)
  .use(plansModule)
  .use(billingModule)
  .use(profileModule)
  .get("/health", async () => {
    await db.execute(sql`select 1`);
    return { status: "ok" };
  });
