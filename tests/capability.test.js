import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const capability = require("../lib/capability.js");

describe("capability detector", () => {
  it("parses Chrome versions", () => {
    expect(capability.parseChromeVersion("Chrome/128.0.0.0")).toBe(128);
  });
});
