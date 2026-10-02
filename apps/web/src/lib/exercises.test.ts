import { describe, expect, it } from "vitest";

import { buildExerciseSearch, parseExerciseQuery, sentenceCase } from "./exercises";

describe("exercise query", () => {
  it("parse lê os searchParams e apara a busca", () => {
    const sp = new URLSearchParams("q=%20squat%20&equipment=barbell");
    expect(parseExerciseQuery(sp)).toEqual({ q: "squat", bodyPart: "", equipment: "barbell" });
  });

  it("build omite vazios e inclui extras", () => {
    const s = buildExerciseSearch({ q: "", bodyPart: "legs", equipment: "" }, { limit: 24, offset: 0 });
    expect(s).toBe("bodyPart=legs&limit=24&offset=0");
  });
});

describe("sentenceCase", () => {
  it("maiusculiza só a primeira letra", () => {
    expect(sentenceCase("supino reto")).toBe("Supino reto");
  });
});
