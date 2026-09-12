import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const chunker = require("../lib/chunker.js");

describe("chunker", () => {
  it("skips short and form content", () => {
    const formElement = { closest: () => true, textContent: "A long form value that should not be processed because it is inside a form element." };
    const paragraph = { closest: () => false, textContent: "This paragraph contains enough meaningful article text to qualify for simplification safely." };
    expect(chunker.isMeaningful(formElement)).toBe(false);
    expect(chunker.isMeaningful(paragraph)).toBe(true);
  });
});
