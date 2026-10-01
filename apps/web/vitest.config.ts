import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Funções puras (sem DOM) — ambiente node é o suficiente e mais rápido.
    environment: "node",
  },
  resolve: {
    alias: {
      // Espelha o path "@/*" do tsconfig para os imports dos testes.
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
