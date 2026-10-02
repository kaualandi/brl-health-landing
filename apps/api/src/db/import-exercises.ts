import { mkdir } from "node:fs/promises";
import { eq, sql } from "drizzle-orm";
import { config } from "../config";
import { db, schema } from ".";
import { fetchExercises, fetchRetry, mapExercise } from "./import-exercises.lib";

const { exercises } = schema;
const limitArg = process.argv.find((a) => a.startsWith("--limit="));
const limit = limitArg ? Number(limitArg.split("=")[1]) : undefined;
const withMedia = process.argv.includes("--media");
const dir = `${config.mediaDir}/exercises`;

async function upsert(rows: ReturnType<typeof mapExercise>[]) {
  await db
    .insert(exercises)
    .values(rows)
    .onConflictDoUpdate({
      target: exercises.id,
      set: {
        name: sql`excluded.name`,
        gifUrl: sql`excluded.gif_url`,
        bodyParts: sql`excluded.body_parts`,
        targetMuscles: sql`excluded.target_muscles`,
        secondaryMuscles: sql`excluded.secondary_muscles`,
        equipments: sql`excluded.equipments`,
        instructions: sql`excluded.instructions`,
      },
    });
}

async function downloadOne(row: { id: string; gifUrl: string }) {
  const file = `${row.id}.gif`;
  if (!(await Bun.file(`${dir}/${file}`).exists())) {
    const res = await fetchRetry(row.gifUrl);
    await Bun.write(`${dir}/${file}`, await res.arrayBuffer());
  }
  await db.update(exercises).set({ mediaPath: file }).where(eq(exercises.id, row.id));
}

async function downloadMedia(max?: number) {
  let failed = 0;
  await mkdir(dir, { recursive: true });
  const rows = await db.select({ id: exercises.id, gifUrl: exercises.gifUrl }).from(exercises).orderBy(exercises.id).limit(max ?? 100000);
  const queue = [...rows];
  const worker = async () => {
    for (let row = queue.shift(); row; row = queue.shift()) {
      await downloadOne(row).catch((e) => {
        failed++;
        console.error(`falha no GIF ${row.id}: ${e.message}`);
      });
    }
  };
  await Promise.all(Array.from({ length: 4 }, worker));
  console.log(`GIFs processados: ${rows.length}, falhas: ${failed}`);
  return failed;
}

let count = 0;
for await (const page of fetchExercises({ limit })) {
  await upsert(page.map(mapExercise));
  count += page.length;
  console.log(`importados ${count}`);
}
const failed = withMedia ? await downloadMedia(limit) : 0;
process.exit(failed > 0 ? 1 : 0);
