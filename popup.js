(function () {
  "use strict";

  const els = {};
  let activeTab = null;
  let status = null;
  let progressTimer = null;

  document.addEventListener("DOMContentLoaded", async () => {
    try {
      bindElements();
      activeTab = await getActiveTab();
      status = await chrome.runtime.sendMessage({ action: "getStatus", url: activeTab?.url || "" });
      renderStatus(status);
      hydrateSettings(status.settings);
      wireEvents();
    } catch (_error) {
      els.status.textContent = "Redacto could not connect to this page.";
      setActionDisabled(true);
    }
  });

  function bindElements() {
    for (const id of [
      "status",
      "profile",
      "showChanges",
      "autoRunTrustedSites",
      "simplify",
      "restore",
      "copyRedacted",
      "speak",
      "cancel",
      "siteToggle",
      "trustSite",
      "allowSensitive",
      "openOptions",
      "openOnboarding",
      "onboardingNotice",
      "progress",
      "progressText",
    ]) {
      els[id] = document.getElementById(id);
    }
    els.levelButtons = Array.from(document.querySelectorAll("[data-level]"));
  }

  async function getActiveTab() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tab;
  }

  function renderStatus(nextStatus) {
    if (!activeTab || !/^https?:\/\//.test(activeTab.url || "")) {
      els.status.textContent = "Open a web page to use Redacto.";
      setActionDisabled(true);
      return;
    }
    if (nextStatus.sensitive) {
      els.status.textContent = "Sensitive site skipped by default.";
      els.allowSensitive.hidden = false;
      setActionDisabled(true);
      return;
    }
    els.allowSensitive.hidden = true;
    if (nextStatus.siteDisabled) {
      els.status.textContent = "Site disabled.";
      els.siteToggle.textContent = "Enable this site";
      setActionDisabled(true);
      return;
    }
    if (!nextStatus.onboarded) els.onboardingNotice.hidden = false;
    els.status.textContent = "Ready to redact locally.";
    els.trustSite.textContent = nextStatus.settings.trustedSites.includes(nextStatus.site)
      ? "Trusted site"
      : "Trust this site";
    setActionDisabled(false);
  }

  function hydrateSettings(settings) {
    els.profile.value = settings.profile;
    els.showChanges.checked = settings.showChanges;
    els.autoRunTrustedSites.checked = settings.autoRunTrustedSites;
    els.levelButtons.forEach((button) => {
      const selected = Number(button.dataset.level) === Number(settings.level);
      button.setAttribute("aria-checked", String(selected));
      button.classList.toggle("selected", selected);
    });
  }

  function wireEvents() {
    els.openOptions.addEventListener("click", () => chrome.runtime.openOptionsPage());
    els.openOnboarding.addEventListener("click", () =>
      chrome.tabs.create({ url: chrome.runtime.getURL("onboarding.html") }),
    );
    els.simplify.addEventListener("click", () => sendPageAction("simplify"));
    els.restore.addEventListener("click", () => sendPageAction("restore"));
    els.copyRedacted.addEventListener("click", copyRedacted);
    els.speak.addEventListener("click", () => sendPageAction("speak"));
    els.cancel.addEventListener("click", () => sendPageAction("cancel"));
    els.profile.addEventListener("change", () =>
      save({ profile: els.profile.value, mode: els.profile.value }),
    );
    els.showChanges.addEventListener("change", () =>
      save({ showChanges: els.showChanges.checked }),
    );
    els.autoRunTrustedSites.addEventListener("change", () =>
      save({ autoRunTrustedSites: els.autoRunTrustedSites.checked }),
    );
    els.siteToggle.addEventListener("click", toggleSite);
    els.trustSite.addEventListener("click", trustSite);
    els.allowSensitive.addEventListener("click", allowSensitiveSite);
    els.levelButtons.forEach((button) => {
      button.addEventListener("click", () => save({ level: Number(button.dataset.level) }));
    });
  }

  async function sendPageAction(action) {
    setBusy(true);
    try {
      const injection = await chrome.runtime.sendMessage({ action: "injectContent", tabId: activeTab.id });
      if (!injection?.ok) throw new Error(injection?.error || "Could not access this page.");
      const response = await chrome.tabs.sendMessage(activeTab.id, { action });
      els.status.textContent = response.message || (response.ok ? "Done." : "Something went wrong.");
    } catch (_error) {
      els.status.textContent = "This page cannot be scanned. Try a regular web page.";
    } finally {
      setBusy(false);
    }
  }

  async function copyRedacted() {
    try {
      const injection = await chrome.runtime.sendMessage({ action: "injectContent", tabId: activeTab.id });
      if (!injection?.ok) throw new Error(injection?.error || "Could not access this page.");
      const response = await chrome.tabs.sendMessage(activeTab.id, { action: "getRedactedText" });
      if (!response?.ok || !response.text) {
        els.status.textContent = "Redact the page before copying its text.";
        return;
      }
      await navigator.clipboard.writeText(response.text);
      els.status.textContent = "Redacted text copied. Review it before sharing.";
    } catch (_error) {
      els.status.textContent = "Could not copy redacted text from this page.";
    }
  }

  async function save(partial) {
    const response = await chrome.runtime.sendMessage({
      action: "saveSettings",
      settings: partial,
    });
    status.settings = response.settings;
    hydrateSettings(response.settings);
  }

  async function toggleSite() {
    const settings = status.settings;
    const site = status.site;
    const disabledSites = settings.disabledSites.includes(site)
      ? settings.disabledSites.filter((item) => item !== site)
      : [...settings.disabledSites, site];
    status.settings = (
      await chrome.runtime.sendMessage({ action: "saveSettings", settings: { disabledSites } })
    ).settings;
    status = await chrome.runtime.sendMessage({ action: "getStatus", url: activeTab.url });
    renderStatus(status);
  }

  async function trustSite() {
    const url = new URL(activeTab.url);
    const response = await chrome.runtime.sendMessage({
      action: "requestTrustedSite",
      origin: url.origin,
      site: status.site,
    });
    if (response.granted) {
      status.settings = response.settings;
      els.status.textContent = "Site trusted.";
      hydrateSettings(response.settings);
    } else {
      els.status.textContent = "Site was not trusted.";
    }
  }

  async function allowSensitiveSite() {
    const allowedSensitiveSites = Array.from(
      new Set([...status.settings.allowedSensitiveSites, status.site]),
    );
    await save({ allowedSensitiveSites });
    status = await chrome.runtime.sendMessage({ action: "getStatus", url: activeTab.url });
    renderStatus(status);
  }

  function setBusy(busy) {
    els.simplify.disabled = busy;
    els.restore.disabled = busy;
    els.copyRedacted.disabled = busy;
    els.cancel.hidden = !busy;
    if (busy) els.status.textContent = "Working locally...";
    if (busy) startProgressPolling();
    else stopProgressPolling();
  }

  function setActionDisabled(disabled) {
    els.simplify.disabled = disabled;
    els.restore.disabled = disabled;
    els.copyRedacted.disabled = disabled;
  }

  function startProgressPolling() {
    els.progress.hidden = false;
    progressTimer = setInterval(async () => {
      const data = await chrome.storage.session.get(["redacto:progress"]);
      const progress = data["redacto:progress"];
      if (!progress) return;
      els.progress.max = progress.total || 1;
      els.progress.value = progress.done || 0;
      els.progressText.textContent = progress.message || "";
    }, 250);
  }

  function stopProgressPolling() {
    if (progressTimer) clearInterval(progressTimer);
    progressTimer = null;
    els.progress.hidden = true;
  }
})();
