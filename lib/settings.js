(function (root) {
  "use strict";

  const CURRENT_SCHEMA_VERSION = 2;
  const DEFAULT_SETTINGS = {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    profile: "cognitive",
    level: 3,
    mode: "clarity",
    useAI: false,
    useOpenRouter: true,
    openRouterModel: "openrouter/free",
    showChanges: false,
    autoRunTrustedSites: false,
    disabledSites: [],
    trustedSites: [],
    allowedSensitiveSites: [],
    display: {
      openDyslexic: false,
      theme: "default",
      lineHeight: 1.6,
      letterSpacing: 0,
      wordSpacing: 0,
      maxWidth: 72,
      focusRuler: false,
      sentencePacing: false,
      ttsEnabled: false,
    },
  };

  const SENSITIVE_HOST_PATTERNS = [
    /(^|\.)bank/i,
    /(^|\.)paypal\.com$/i,
    /(^|\.)stripe\.com$/i,
    /(^|\.)irs\.gov$/i,
    /(^|\.)ssa\.gov$/i,
    /(^|\.)medicare\.gov$/i,
    /(^|\.)mychart/i,
    /(^|\.)epic\.com$/i,
    /(^|\.)gmail\.com$/i,
    /(^|\.)mail\.google\.com$/i,
    /(^|\.)outlook\.live\.com$/i,
    /(^|\.)docs\.google\.com$/i,
    /(^|\.)github\.com$/i,
    /(^|\.)gitlab\.com$/i,
  ];

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function mergeSettings(stored) {
    return {
      ...clone(DEFAULT_SETTINGS),
      ...(stored || {}),
      display: { ...DEFAULT_SETTINGS.display, ...((stored && stored.display) || {}) },
    };
  }

  function migrateSettings(stored) {
    const merged = mergeSettings(stored);
    if (!stored || stored.schemaVersion !== CURRENT_SCHEMA_VERSION) {
      merged.schemaVersion = CURRENT_SCHEMA_VERSION;
    }
    merged.level = clamp(Number(merged.level) || 3, 1, 5);
    merged.disabledSites = Array.isArray(merged.disabledSites) ? merged.disabledSites : [];
    merged.allowedSensitiveSites = Array.isArray(merged.allowedSensitiveSites)
      ? merged.allowedSensitiveSites
      : [];
    return merged;
  }

  async function getSettings() {
    const data = await chrome.storage.sync.get(["beta-eye:settings"]);
    const settings = migrateSettings(data["beta-eye:settings"]);
    if (!data["beta-eye:settings"] || data["beta-eye:settings"].schemaVersion !== CURRENT_SCHEMA_VERSION) {
      await chrome.storage.sync.set({ "beta-eye:settings": settings });
    }
    return settings;
  }

  async function saveSettings(partial) {
    const current = await getSettings();
    const next = mergeSettings({
      ...current,
      ...partial,
      display: { ...current.display, ...partial.display },
    });
    await chrome.storage.sync.set({ "beta-eye:settings": next });
    return next;
  }

  async function getOnboardingState() {
    const data = await chrome.storage.local.get(["beta-eye:onboarded"]);
    return Boolean(data["beta-eye:onboarded"]);
  }

  async function setOnboardingState(onboarded) {
    await chrome.storage.local.set({ "beta-eye:onboarded": Boolean(onboarded) });
  }

  async function getOpenRouterKey() {
    const data = await chrome.storage.local.get(["beta-eye:openrouter-key"]);
    return typeof data["beta-eye:openrouter-key"] === "string"
      ? data["beta-eye:openrouter-key"]
      : "";
  }

  async function saveOpenRouterKey(key) {
    await chrome.storage.local.set({ "beta-eye:openrouter-key": String(key || "").trim() });
  }

  function getSiteKey(url) {
    try {
      return new URL(url).hostname.replace(/^www\./, "");
    } catch (_error) {
      return "";
    }
  }

  function isSensitiveUrl(url) {
    const host = getSiteKey(url);
    return SENSITIVE_HOST_PATTERNS.some((pattern) => pattern.test(host));
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  root.BetaEyeSettings = {
    CURRENT_SCHEMA_VERSION,
    DEFAULT_SETTINGS,
    SENSITIVE_HOST_PATTERNS,
    migrateSettings,
    getSettings,
    saveSettings,
    getOnboardingState,
    setOnboardingState,
    getOpenRouterKey,
    saveOpenRouterKey,
    getSiteKey,
    isSensitiveUrl,
  };

  if (typeof module !== "undefined") module.exports = root.BetaEyeSettings;
})(typeof globalThis !== "undefined" ? globalThis : window);
