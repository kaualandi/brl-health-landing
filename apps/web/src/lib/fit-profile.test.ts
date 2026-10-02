import { describe, expect, it } from "vitest";

import { INITIAL_FIT_FORM, withLocation } from "./fit-profile";

describe("withLocation", () => {
  it("define local e equipamento padrão juntos", () => {
    const f = withLocation(INITIAL_FIT_FORM, "home");
    expect(f.location).toBe("home");
    expect(f.equipment).toEqual(["bodyweight"]);
  });

  it("mantém a seleção ao reescolher o mesmo local", () => {
    const f = { ...withLocation(INITIAL_FIT_FORM, "gym"), equipment: ["cable"] };
    expect(withLocation(f, "gym").equipment).toEqual(["cable"]);
  });
});
