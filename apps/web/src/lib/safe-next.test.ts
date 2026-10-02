import { describe, expect, it } from "vitest";
import { safeNext } from "./safe-next";

describe("safeNext", () => {
  it("aceita caminho interno", () => expect(safeNext("/fit/comecar")).toBe("/fit/comecar"));
  it.each(["//evil", "/\\evil", "/\\\\evil", "https://evil", "javascript:alert(1)", "", null, undefined])(
    "rejeita %s",
    (v) => expect(safeNext(v, "/x")).toBe("/x"),
  );
});
