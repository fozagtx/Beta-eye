import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const fallback = require("../lib/rules-fallback.js");

describe("rules fallback", () => {
  it("preserves names, quotes, and numbers", () => {
    const input =
      'Dr. Jane Smith will utilize approximately 25 mg before 2026 and said "Do not change this."';
    const output = fallback.simplify(input, { level: 5 });
    expect(output).toContain("Jane Smith");
    expect(output).toContain("25");
    expect(output).toContain("2026");
    expect(output).toContain('"Do not change this."');
  });

  it("preserves warning blocks", () => {
    const input = "Warning: This medication dosage is prescribed by a clinician.";
    expect(fallback.simplify(input, { level: 5 })).toBe(input);
  });
});
