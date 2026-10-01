const required = (name: string) => {
  const value = process.env[name];
  if (!value) throw new Error(`Variável de ambiente ${name} não definida (ver .env.example)`);
  return value;
};

const jwtSecret = required("JWT_SECRET");
if (jwtSecret.length < 32) throw new Error("JWT_SECRET precisa de ao menos 32 caracteres");

export const config = {
  port: Number(process.env.PORT ?? 3333),
  databaseUrl: required("DATABASE_URL"),
  jwtSecret,
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:3000",
  timeZone: process.env.APP_TZ ?? "America/Sao_Paulo",
  trustProxy: process.env.TRUST_PROXY === "true",
  authRateLimit: Number(process.env.AUTH_RATE_LIMIT ?? 10),
};
