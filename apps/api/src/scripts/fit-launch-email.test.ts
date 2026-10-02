import { describe, expect, it } from "bun:test";
import { chunk, launchMail, pending, runLaunch, sendLaunch, type Subscriber } from "./fit-launch-email.lib";

const sub = (id: number, over: Partial<Subscriber> = {}): Subscriber => ({
  id,
  email: `u${id}@teste.local`,
  source: "fit",
  launchNotifiedAt: null,
  ...over,
});

const deps = (log: { sent: string[]; marked: number[]; sleeps: number[] }, failOn?: string) => ({
  send: async (m: { to: string }) => {
    if (m.to === failOn) throw new Error("falhou");
    log.sent.push(m.to);
  },
  mark: async (id: number) => void log.marked.push(id),
  sleep: async (ms: number) => void log.sleeps.push(ms),
  webUrl: "http://web.test",
  batchSize: 2,
  pauseMs: 50,
});

describe("lançamento do Fit", () => {
  it("seleciona só source=fit ainda não avisados", () => {
    const rows = [sub(1), sub(2, { launchNotifiedAt: new Date() }), sub(3, { source: "newsletter" })];
    expect(pending(rows).map((r) => r.id)).toEqual([1]);
  });

  it("divide em lotes", () => expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]));

  it("envia em lotes com pausa entre eles e marca cada envio", async () => {
    const log = { sent: [] as string[], marked: [] as number[], sleeps: [] as number[] };
    const r = await sendLaunch([sub(1), sub(2), sub(3)], deps(log));
    expect(r).toEqual({ sent: 3, failed: [] });
    expect(log.marked).toEqual([1, 2, 3]);
    expect(log.sleeps).toEqual([50]);
  });

  it("falha no meio não marca o falho; reexecutar continua de onde parou", async () => {
    const rows = [sub(1), sub(2), sub(3)];
    const log = { sent: [] as string[], marked: [] as number[], sleeps: [] as number[] };
    const first = await sendLaunch(rows, deps(log, "u2@teste.local"));
    expect(first.failed).toEqual(["u2@teste.local"]);
    expect(log.marked).toEqual([1, 3]);
    const after = rows.map((r) => (log.marked.includes(r.id) ? { ...r, launchNotifiedAt: new Date() } : r));
    const again = await sendLaunch(after, deps(log));
    expect(again.sent).toBe(1);
    expect(log.sent).toEqual(["u1@teste.local", "u3@teste.local", "u2@teste.local"]);
    expect((await sendLaunch(after.map((r) => ({ ...r, launchNotifiedAt: new Date() })), deps(log))).sent).toBe(0);
  });

  it("e-mail traz CTA para /fit em html e texto", () => {
    const m = launchMail("a@b.c", "http://web.test");
    expect(m.html).toContain('href="http://web.test/fit"');
    expect(m.text).toContain("http://web.test/fit");
    expect(m.text).toContain("lista de espera");
  });

  it("dry-run não envia, não marca e não pega o lock", async () => {
    const log = { sent: [] as string[], marked: [] as number[], sleeps: [] as number[] };
    let locks = 0;
    const r = await runLaunch([sub(1), sub(2)], { ...deps(log), dryRun: true, lock: async () => (locks++, true), unlock: async () => {} });
    expect(r.status).toBe("dry-run");
    expect(r.would.length).toBe(2);
    expect([log.sent, log.marked, locks]).toEqual([[], [], 0]);
  });

  it("lock ocupado aborta sem enviar", async () => {
    const log = { sent: [] as string[], marked: [] as number[], sleeps: [] as number[] };
    const r = await runLaunch([sub(1)], { ...deps(log), dryRun: false, lock: async () => false, unlock: async () => {} });
    expect(r.status).toBe("locked");
    expect([log.sent, log.marked]).toEqual([[], []]);
  });

  it("modo real libera o lock mesmo com falha parcial e não marca o falho", async () => {
    const log = { sent: [] as string[], marked: [] as number[], sleeps: [] as number[] };
    let released = false;
    const r = await runLaunch([sub(1), sub(2)], {
      ...deps(log, "u1@teste.local"),
      dryRun: false,
      lock: async () => true,
      unlock: async () => void (released = true),
    });
    expect(r.status).toBe("done");
    expect(r.failed).toEqual(["u1@teste.local"]);
    expect(log.marked).toEqual([2]);
    expect(released).toBe(true);
  });

  it("relê a lista dentro do lock: quem outra execução já marcou não recebe de novo", async () => {
    const log = { sent: [] as string[], marked: [] as number[], sleeps: [] as number[] };
    const stale = [sub(1), sub(2)];
    const fresh = [sub(1, { launchNotifiedAt: new Date() }), sub(2)];
    const r = await runLaunch(stale, {
      ...deps(log),
      dryRun: false,
      lock: async () => true,
      unlock: async () => {},
      reload: async () => fresh,
    });
    expect(r.status).toBe("done");
    expect(log.sent).toEqual(["u2@teste.local"]);
  });
});
