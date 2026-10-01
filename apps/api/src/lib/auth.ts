import { jwt } from "@elysiajs/jwt";
import { Elysia } from "elysia";
import { config } from "../config";

export const jwtPlugin = jwt({ name: "jwt", secret: config.jwtSecret, alg: "HS256", exp: "15m" });

/** Rotas com `{ auth: true }` recebem `userId` (do `sub` do JWT) ou respondem 401 `{ error }`. */
export const auth = new Elysia({ name: "auth" }).use(jwtPlugin).macro({
  auth: {
    async resolve({ jwt, headers, status }) {
      const token = headers.authorization?.match(/^Bearer (.+)$/)?.[1];
      const payload = token ? await jwt.verify(token) : false;
      const userId = payload && Number(payload.sub);
      if (!userId) return status(401, { error: "Não autenticado" });
      return { userId };
    },
  },
});
