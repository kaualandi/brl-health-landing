import { cors } from "@elysiajs/cors";
import { sql } from "drizzle-orm";
import { Elysia } from "elysia";
import { config } from "./config";
import { db } from "./db";
import { errors } from "./lib/errors";
import { consultationsModule } from "./modules/consultations";
import { catalogModule } from "./modules/catalog";
import { accountModule } from "./modules/account";
import { authModule } from "./modules/auth";
import { engagementModule } from "./modules/engagement";
import { billingModule } from "./modules/billing";
import { plansModule } from "./modules/plans";
import { stripeModule } from "./modules/stripe";
import { profileModule } from "./modules/profile";

export const app = new Elysia()
  .use(errors)
  .use(cors({ origin: config.corsOrigin }))
  .use(catalogModule)
  .use(authModule)
  .use(engagementModule)
  .use(plansModule)
  .use(consultationsModule)
  .use(billingModule)
  .use(stripeModule)
  .use(profileModule)
  .use(accountModule)
  .get("/health", async () => {
    await db.execute(sql`select 1`);
    return { status: "ok" };
  });
