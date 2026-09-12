(function () {
  "use strict";

  const els = {};
  let activeTab = null;
  let status = null;

  document.addEventListener("DOMContentLoaded", async () => {
    bindElements();
    activeTab = await getActiveTab();
    status = await chrome.runtime.sendMessage({ action: "getStatus", url: activeTab?.url || "" });
    renderStatus(status);
    hydrateSettings(status.settings);
    wireEvents();
  });

  function bindElements() {
    for (const id of ["status", "profile", "showChanges", "simplify", "restore", "siteToggle", "openOptions"]) {
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
      els.status.textContent = "Open a web page to use See.";
      setActionDisabled(true);
      return;
    }
    if (nextStatus.sensitive) {
      els.status.textContent = "Sensitive site skipped by default.";
      setActionDisabled(true);
      return;
    }
    if (nextStatus.siteDisabled) {
      els.status.textContent = "Site disabled.";
      els.siteToggle.textContent = "Enable this site";
      setActionDisabled(true);
      return;
    }
    els.status.textContent = nextStatus.capability.message;
    setActionDisabled(false);
  }

  function hydrateSettings(settings) {
    els.profile.value = settings.profile;
    els.showChanges.checked = settings.showChanges;
    els.levelButtons.forEach((button) => {
      const selected = Number(button.dataset.level) === Number(settings.level);
      button.setAttribute("aria-checked", String(selected));
      button.classList.toggle("selected", selected);
    });
  }

  function wireEvents() {
    els.openOptions.addEventListener("click", () => chrome.runtime.openOptionsPage());
    els.simplify.addEventListener("click", () => sendPageAction("simplify"));
    els.restore.addEventListener("click", () => sendPageAction("restore"));
    els.profile.addEventListener("change", () => save({ profile: els.profile.value, mode: els.profile.value }));
    els.showChanges.addEventListener("change", () => save({ showChanges: els.showChanges.checked }));
    els.siteToggle.addEventListener("click", toggleSite);
    els.levelButtons.forEach((button) => {
      button.addEventListener("click", () => save({ level: Number(button.dataset.level) }));
    });
  }

  async function sendPageAction(action) {
    setBusy(true);
    await chrome.runtime.sendMessage({ action: "injectContent", tabId: activeTab.id });
    const response = await chrome.tabs.sendMessage(activeTab.id, { action });
    els.status.textContent = response.message || (response.ok ? "Done." : "Something went wrong.");
    setBusy(false);
  }

  async function save(partial) {
    const response = await chrome.runtime.sendMessage({ action: "saveSettings", settings: partial });
    status.settings = response.settings;
    hydrateSettings(response.settings);
  }

  async function toggleSite() {
    const settings = status.settings;
    const site = status.site;
    const disabledSites = settings.disabledSites.includes(site)
      ? settings.disabledSites.filter((item) => item !== site)
      : [...settings.disabledSites, site];
    status.settings = (await chrome.runtime.sendMessage({ action: "saveSettings", settings: { disabledSites } })).settings;
    status = await chrome.runtime.sendMessage({ action: "getStatus", url: activeTab.url });
    renderStatus(status);
  }

  function setBusy(busy) {
    els.simplify.disabled = busy;
    els.restore.disabled = busy;
    if (busy) els.status.textContent = "Working locally...";
  }

  function setActionDisabled(disabled) {
    els.simplify.disabled = disabled;
    els.restore.disabled = disabled;
  }
})();
