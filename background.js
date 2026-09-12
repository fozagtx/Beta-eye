(function () {
  "use strict";

  importScripts("lib/settings.js", "lib/capability.js");

  const CONTENT_FILES = [
    "lib/settings.js",
    "lib/capability.js",
    "lib/prompt-library.js",
    "lib/rules-fallback.js",
    "lib/chunker.js",
    "lib/sanitizer.js",
    "lib/cache.js",
    "lib/renderer.js",
    "lib/engine.js",
    "content.js"
  ];

  chrome.runtime.onInstalled.addListener(async ({ reason }) => {
    if (reason === "install") await chrome.storage.local.set({ "see:onboarded": false });
  });

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    (async () => {
      if (request.action === "getStatus") {
        sendResponse(await getStatus(request.url));
        return;
      }
      if (request.action === "injectContent" && request.tabId) {
        await ensureContent(request.tabId);
        sendResponse({ ok: true });
      }
      if (request.action === "saveSettings") {
        sendResponse({ ok: true, settings: await globalThis.SeeSettings.saveSettings(request.settings) });
      }
    })().catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  });

  chrome.commands.onCommand.addListener(async (command, tab) => {
    if (command !== "toggle-simplification" || !tab?.id || !isHttpUrl(tab.url)) return;
    await ensureContent(tab.id);
    chrome.tabs.sendMessage(tab.id, { action: "toggleSimplification" });
  });

  async function ensureContent(tabId) {
    await chrome.scripting.executeScript({ target: { tabId }, files: CONTENT_FILES });
    await chrome.scripting.insertCSS({ target: { tabId }, files: ["content.css"] });
  }

  async function getStatus(url) {
    const capability = await globalThis.SeeCapability.detect();
    const settings = await globalThis.SeeSettings.getSettings();
    const site = globalThis.SeeSettings.getSiteKey(url || "");
    const siteDisabled = Boolean(site && settings.disabledSites.includes(site));
    const sensitive =
      globalThis.SeeSettings.isSensitiveUrl(url || "") && !settings.allowedSensitiveSites.includes(site);
    return { ok: true, capability, site, siteDisabled, sensitive, settings };
  }

  function isHttpUrl(url) {
    return /^https?:\/\//.test(url || "");
  }
})();
