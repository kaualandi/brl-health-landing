import { drizzle } from "drizzle-orm/bun-sql";
import { config } from "../config";
import * as schema from "./schema";

export const db = drizzle(config.databaseUrl, { schema });
export { schema };
