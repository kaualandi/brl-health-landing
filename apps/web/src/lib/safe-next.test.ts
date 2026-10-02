import { describe, expect, it } from "vitest";
import { safeNext } from "./safe-next";

describe("safeNext", () => {
  it("aceita caminho interno", () => expect(safeNext("/fit/comecar")).toBe("/fit/comecar"));
  it("mantém query e hash", () => expect(safeNext("/fit/app?aba=plano#x")).toBe("/fit/app?aba=plano#x"));
  it.each(["//evil", "/\\evil", "/\\\\evil", "/\t/evil.com", "/\n/evil.com", "/\r\\evil.com", "fit", "https://evil", "javascript:alert(1)", "", null, undefined])(
    "rejeita %s",
    (v) => expect(safeNext(v, "/x")).toBe("/x"),
  );
});
