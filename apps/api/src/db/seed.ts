import { db } from ".";

// Seed estático e idempotente (ON CONFLICT DO NOTHING); sem entrada externa.
const seed = await Bun.file(new URL("./seed.sql", import.meta.url)).text();
await db.$client.unsafe(seed);
console.log("seed aplicado");
process.exit(0);
