import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const prompts = require("../lib/prompt-library.js");

describe("prompt library", () => {
  it("builds versioned strict-json prompts", () => {
    const prompt = prompts.buildPrompt({ level: 3, mode: "clarity" }, "Complex text");
    expect(prompt.version).toBe(prompts.PROMPT_VERSION);
    expect(prompt.system).toContain("Return strict JSON only");
    expect(prompt.user).toContain("Complex text");
  });

  it("parses schema output", () => {
    expect(prompts.parseAiResponse('{"text":"Simple text"}')).toBe("Simple text");
  });
});
