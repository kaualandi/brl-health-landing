import { migrate } from "drizzle-orm/bun-sql/migrator";
import { db } from ".";

await migrate(db, { migrationsFolder: `${import.meta.dir}/../../drizzle` });
console.log("migrações aplicadas");
process.exit(0);
