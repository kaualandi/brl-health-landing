import { migrate } from "drizzle-orm/bun-sql/migrator";
import { db } from ".";

await migrate(db, { migrationsFolder: new URL("../../drizzle", import.meta.url).pathname });
console.log("migrações aplicadas");
process.exit(0);
