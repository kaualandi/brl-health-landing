import { db } from ".";

// Seed estático e idempotente (ON CONFLICT DO NOTHING); sem entrada externa.
const seed = await Bun.file(`${import.meta.dir}/seed.sql`).text();
await db.$client.unsafe(seed);
console.log("seed aplicado");
process.exit(0);
