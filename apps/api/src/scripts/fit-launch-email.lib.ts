export type Subscriber = { id: number; email: string; source: string; launchNotifiedAt: Date | null };
export type Mail = { to: string; subject: string; text: string; html: string };

/** Só quem entrou na lista do Fit e ainda não foi avisado (newsletter fica de fora). */
export const pending = (rows: Subscriber[]) => rows.filter((r) => r.source === "fit" && !r.launchNotifiedAt);

export function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

export function launchMail(to: string, webUrl: string): Mail {
  const url = `${webUrl}/fit`;
  const text = `O BRL Fit chegou!\n\nPlano de treino gerado pelo seu perfil, 1.500 exercícios em português com GIF, registro de séries com timer (até offline) e acompanhamento de progresso. Comece grátis:\n${url}\n\nVocê recebeu este e-mail porque entrou na lista de espera do BRL Fit. Este é o único aviso de lançamento.`;
  const html = `<!doctype html><html lang="pt-BR"><body style="margin:0;background:#0d0d1a;font-family:Inter,Arial,sans-serif;color:#e8e8f0">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="100%" style="max-width:520px;background:#13131f;border:1px solid #222233;border-radius:16px">
<tr><td style="padding:32px">
<p style="margin:0 0 8px;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#ff8906;font-weight:700">BRL Health</p>
<h1 style="margin:0 0 16px;font-size:28px;line-height:1.1;color:#ffffff">O <span style="color:#ff8906">BRL Fit</span> chegou.</h1>
<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#b8b8c8">Você estava na lista de espera — agora é só entrar. Plano de treino gerado pelo seu perfil, 1.500 exercícios em português com GIF, registro de séries com timer (até offline) e acompanhamento de progresso.</p>
<p style="margin:24px 0"><a href="${url}" style="display:inline-block;background:#ff8906;color:#0d0d1a;font-weight:700;text-decoration:none;padding:14px 28px;border-radius:12px">Começar grátis</a></p>
<p style="margin:0;font-size:12px;line-height:1.5;color:#77778a">Você recebeu este e-mail porque entrou na lista de espera do BRL Fit. Este é o único aviso de lançamento.</p>
</td></tr></table></td></tr></table></body></html>`;
  return { to, subject: "O BRL Fit chegou - comece grátis", text, html };
}

type Deps = {
  send: (mail: Mail) => Promise<void>;
  mark: (id: number) => Promise<void>;
  sleep: (ms: number) => Promise<void>;
  webUrl: string;
  batchSize: number;
  pauseMs: number;
};

/** Envia em lotes, marca cada um após o envio e segue mesmo se um falhar (reexecutar retoma). */
export async function sendLaunch(rows: Subscriber[], d: Deps) {
  const result = { sent: 0, failed: [] as string[] };
  const batches = chunk(pending(rows), d.batchSize);
  for (const [i, batch] of batches.entries()) {
    if (i > 0) await d.sleep(d.pauseMs);
    for (const r of batch) {
      try {
        await d.send(launchMail(r.email, d.webUrl));
      } catch {
        result.failed.push(r.email);
        continue;
      }
      await d.mark(r.id);
      result.sent++;
    }
  }
  return result;
}

type RunDeps = Deps & {
  dryRun: boolean;
  lock: () => Promise<boolean>;
  unlock: () => Promise<void>;
  reload?: () => Promise<Subscriber[]>; // relê a lista já com o lock (outra execução pode ter marcado)
};

/** Dry-run só conta; modo real exige o lock (outra execução em andamento aborta). */
export async function runLaunch(rows: Subscriber[], d: RunDeps) {
  if (d.dryRun) return { status: "dry-run" as const, sent: 0, failed: [] as string[], would: pending(rows) };
  if (!(await d.lock())) return { status: "locked" as const, sent: 0, failed: [] as string[], would: [] };
  try {
    const fresh = d.reload ? await d.reload() : rows;
    return { status: "done" as const, ...(await sendLaunch(fresh, d)), would: [] };
  } finally {
    await d.unlock();
  }
}
