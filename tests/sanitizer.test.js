import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const sanitizer = require("../lib/sanitizer.js");

describe("sanitizer", () => {
  it("keeps text but strips control characters", () => {
    expect(sanitizer.textOnly("Hello\u0000 <b>reader</b>")).toBe("Hello <b>reader</b>");
  });
});
