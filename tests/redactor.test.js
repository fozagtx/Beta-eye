import { describe, expect, it } from "vitest";
import { redact } from "../lib/redactor.js";

describe("redactor", () => {
  it("replaces common confidential values without changing surrounding text", () => {
    const result = redact(
      "Contact jane@example.com at +1 (555) 123-4567. Token: sk-or-v1-abcdefghijklmnopqrstuvwxyz1234567890.",
    );
    expect(result.text).toContain("Contact [REDACTED_EMAIL] at [REDACTED_PHONE].");
    expect(result.text).toContain("Token: [REDACTED_SECRET].");
    expect(result.findings).toBe(3);
  });

  it("does not alter ordinary named entities or numbers", () => {
    const input = "Beta-eye launched in 2026 for Ada Lovelace.";
    expect(redact(input).text).toBe(input);
  });
});
