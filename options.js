(function () {
  "use strict";

  const ids = [
    "openDyslexic",
    "focusRuler",
    "sentencePacing",
    "theme",
    "lineHeight",
    "letterSpacing",
    "wordSpacing",
    "maxWidth",
    "ttsEnabled",
    "autoRunTrustedSites",
  ];
  const els = {};

  document.addEventListener("DOMContentLoaded", async () => {
    ids.forEach((id) => {
      els[id] = document.getElementById(id);
    });
    els.status = document.getElementById("status");
    const settings = await window.RedactoSettings.getSettings();
    hydrate(settings);
    ids.forEach((id) => els[id].addEventListener("input", save));
  });

  function hydrate(settings) {
    els.openDyslexic.checked = settings.display.openDyslexic;
    els.focusRuler.checked = settings.display.focusRuler;
    els.sentencePacing.checked = settings.display.sentencePacing;
    els.theme.value = settings.display.theme;
    els.lineHeight.value = settings.display.lineHeight;
    els.letterSpacing.value = settings.display.letterSpacing;
    els.wordSpacing.value = settings.display.wordSpacing;
    els.maxWidth.value = settings.display.maxWidth;
    els.ttsEnabled.checked = settings.display.ttsEnabled;
    els.autoRunTrustedSites.checked = settings.autoRunTrustedSites;
  }

  async function save() {
    await window.RedactoSettings.saveSettings({
      autoRunTrustedSites: els.autoRunTrustedSites.checked,
      display: {
        openDyslexic: els.openDyslexic.checked,
        focusRuler: els.focusRuler.checked,
        sentencePacing: els.sentencePacing.checked,
        ttsEnabled: els.ttsEnabled.checked,
        theme: els.theme.value,
        lineHeight: Number(els.lineHeight.value),
        letterSpacing: Number(els.letterSpacing.value),
        wordSpacing: Number(els.wordSpacing.value),
        maxWidth: Number(els.maxWidth.value),
      },
    });
    els.status.textContent = "Settings saved.";
  }
})();
