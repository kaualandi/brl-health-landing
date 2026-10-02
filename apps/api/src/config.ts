const required = (name: string) => {
  const value = process.env[name];
  if (!value) throw new Error(`Variável de ambiente ${name} não definida (ver .env.example)`);
  return value;
};

const jwtSecret = required("JWT_SECRET");
if (jwtSecret.length < 32) throw new Error("JWT_SECRET precisa de ao menos 32 caracteres");

const port = Number(process.env.PORT ?? 3333);

export const config = {
  port,
  publicUrl: (process.env.PUBLIC_URL ?? `http://localhost:${port}`).replace(/\/+$/, ""),
  databaseUrl: required("DATABASE_URL"),
  jwtSecret,
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:3000",
  timeZone: process.env.APP_TZ ?? "America/Sao_Paulo",
  trustProxy: process.env.TRUST_PROXY === "true",
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || undefined,
  stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY || undefined,
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || undefined,
  resendApiKey: process.env.RESEND_API_KEY,
  emailFrom: process.env.EMAIL_FROM ?? "BRL Health <nao-responda@brlhealth.com.br>",
  mediaDir: process.env.MEDIA_DIR ?? `${import.meta.dir}/../storage/media`,
  authRateLimit: Number(process.env.AUTH_RATE_LIMIT ?? 10),
};
