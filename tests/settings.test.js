import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const settings = require("../lib/settings.js");

describe("settings", () => {
  it("migrates partial settings", () => {
    const migrated = settings.migrateSettings({ level: 9, display: { theme: "soft" } });
    expect(migrated.schemaVersion).toBe(settings.CURRENT_SCHEMA_VERSION);
    expect(migrated.level).toBe(5);
    expect(migrated.display.theme).toBe("soft");
  });

  it("detects sensitive urls", () => {
    expect(settings.isSensitiveUrl("https://mail.google.com/mail/u/0")).toBe(true);
    expect(settings.isSensitiveUrl("https://example.com/article")).toBe(false);
  });
});
