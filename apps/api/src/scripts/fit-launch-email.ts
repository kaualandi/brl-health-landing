import { SQL } from "bun";
import { and, eq, isNull } from "drizzle-orm";
import { config } from "../config";
import { db, schema } from "../db";
import { deliver } from "../lib/email";
import { pending, runLaunch } from "./fit-launch-email.lib";

const BATCH_SIZE = 10;
const PAUSE_MS = 2000;
const LOCK_KEY = 178_001; // constante fixa: uma execução real por vez

const dryRun = process.argv.includes("--dry-run");
const rows = await db.select().from(schema.waitlist);
const todo = pending(rows);
console.log(`${todo.length} de ${rows.length} na lista para avisar (source=fit, sem launch_notified_at).`);

if (!dryRun && !config.resendApiKey) {
  console.error("RESEND_API_KEY não definida: sem chave o envio seria só log. Abortando (use --dry-run para listar).");
  process.exit(1);
}

// Conexão dedicada: o advisory lock é de sessão e some se o processo cair.
const lockConn = new SQL(config.databaseUrl, { max: 1 });
const result = await runLaunch(rows, {
  dryRun,
  lock: async () => (await lockConn`select pg_try_advisory_lock(${LOCK_KEY}) as ok`)[0].ok === true,
  unlock: async () => void (await lockConn`select pg_advisory_unlock(${LOCK_KEY})`),
  reload: () => db.select().from(schema.waitlist),
  send: deliver,
  mark: async (id) => {
    await db
      .update(schema.waitlist)
      .set({ launchNotifiedAt: new Date() })
      .where(and(eq(schema.waitlist.id, id), isNull(schema.waitlist.launchNotifiedAt)));
  },
  sleep: (ms) => Bun.sleep(ms),
  webUrl: config.webUrl,
  batchSize: BATCH_SIZE,
  pauseMs: PAUSE_MS,
}).finally(() => lockConn.close());

if (result.status === "dry-run") {
  for (const r of result.would) console.log(`  - ${r.email}`);
  console.log(`dry-run: nada enviado nem marcado. Link do e-mail: ${config.webUrl}/fit`);
  process.exit(0);
}
if (result.status === "locked") {
  console.error("Outra execução do envio está em andamento (lock ocupado). Abortando sem enviar.");
  process.exit(2);
}
console.log(`enviados: ${result.sent}; falhas: ${result.failed.length}`);
for (const e of result.failed) console.log(`  falhou: ${e}`);
process.exit(result.failed.length ? 1 : 0);
