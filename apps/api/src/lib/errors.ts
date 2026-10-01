import { Elysia } from "elysia";

/** Contrato de erro do front (src/lib/axios.ts): `{ error }` ou `{ errors: string[] }` (400). */
export const errors = new Elysia({ name: "errors" }).onError({ as: "global" }, ({ code, error, set }) => {
  if (code === "VALIDATION") {
    set.status = 400;
    return { errors: error.all.map((e) => ("summary" in e && e.summary) || e.message) };
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
