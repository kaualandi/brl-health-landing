import { Elysia } from "elysia";

/** Contrato de erro do front (src/lib/axios.ts): `{ error }` ou `{ errors: string[] }` (400). */
// Prefere o `error` customizado do schema (PT) ao texto padrão do TypeBox.
const messageOf = (e: { message: string; schema?: unknown; summary?: string }) => {
  const custom = (e.schema as { error?: unknown } | undefined)?.error;
  return typeof custom === "string" ? custom : e.summary || e.message;
};

export const errors = new Elysia({ name: "errors" }).onError({ as: "global" }, ({ code, error, set }) => {
  if (code === "VALIDATION") {
    set.status = 400;
    return { errors: error.all.map(messageOf) };
  }
  if (code === "NOT_FOUND") {
    set.status = 404;
    return { error: "Rota não encontrada" };
  }
  if (code === "PARSE") {
    set.status = 400;
    return { errors: ["Corpo da requisição inválido"] };
  }
  if (typeof code === "number") return;
  console.error(error);
  set.status = 500;
  return { error: "Erro interno" };
});
