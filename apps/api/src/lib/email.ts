import { config } from "../config";

type Email = { to: string; subject: string; text: string; html?: string };

/** Caixa de saída em memória, só nos testes (NODE_ENV=test) e sem chave do Resend. */
export const sentEmails: Email[] = [];

/** Envio aguardável (lança em falha); `sendEmail` é a versão fire-and-forget. */
export async function deliver(mail: Email) {
  if (!config.resendApiKey) {
    if (process.env.NODE_ENV === "test") sentEmails.push(mail);
    else console.log(`[email] ${mail.to} | ${mail.subject}\n${mail.text}`);
    return;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${config.resendApiKey}`, "content-type": "application/json" },
    body: JSON.stringify({ from: config.emailFrom, ...mail }),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
}

/** Dispara sem bloquear a resposta; falhas só vão pro log. */
export function sendEmail(mail: Email) {
  deliver(mail).catch((e) => console.error("[email] falha no envio", e));
}
