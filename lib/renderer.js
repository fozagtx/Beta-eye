(function (root) {
  "use strict";

  const state = {
    simplified: false,
    records: new Map(),
  };

  function render(record, simplifiedText, settings) {
    if (!state.records.has(record.element)) {
      state.records.set(record.element, { original: record.element.textContent });
    }
    record.element.dataset.seeSimplified = "true";
    record.element.dataset.seeOriginal = state.records.get(record.element).original;
    if (settings.showChanges) {
      renderChangeView(record.element, state.records.get(record.element).original, simplifiedText);
    } else {
      record.element.textContent = simplifiedText;
    }
    record.element.classList.add("beta-eye-simplified-text");
    record.element.classList.toggle("beta-eye-show-changes", Boolean(settings.showChanges));
    state.simplified = true;
  }

  function restoreAll(rootNode) {
    for (const [element, record] of state.records.entries()) {
      if (rootNode.contains(element)) {
        element.textContent = record.original;
        element.classList.remove("beta-eye-simplified-text", "beta-eye-show-changes");
        delete element.dataset.seeSimplified;
        delete element.dataset.seeOriginal;
      }
    }
    state.simplified = false;
  }

  function renderChangeView(element, original, simplified) {
    const fragment = document.createDocumentFragment();
    const originalWords = new Set(original.toLowerCase().match(/\b[\w'-]+\b/g) || []);
    const words = simplified.split(/(\s+)/);
    for (const word of words) {
      if (/^\s+$/.test(word) || originalWords.has(word.toLowerCase())) {
        fragment.append(document.createTextNode(word));
      } else {
        const marker = document.createElement("mark");
        marker.className = "beta-eye-change-token";
        marker.textContent = word;
        fragment.append(marker);
      }
    }
    element.replaceChildren(fragment);
  }

  function toggleOriginal(rootNode) {
    if (state.simplified) {
      restoreAll(rootNode);
      return "original";
    }
    return "unchanged";
  }

  function applyDisplay(settings) {
    let style = document.getElementById("beta-eye-display-style");
    if (!style) {
      style = document.createElement("style");
      style.id = "beta-eye-display-style";
      document.documentElement.appendChild(style);
    }
    const display = settings.display;
    const fontFace = display.openDyslexic
      ? `@font-face{font-family:OpenDyslexic;src:url("${chrome.runtime.getURL("fonts/OpenDyslexic-Regular.woff2")}") format("woff2");font-display:swap;}`
      : "";
    style.textContent = `${fontFace}
      .beta-eye-simplified-text{
        line-height:${display.lineHeight};
        letter-spacing:${display.letterSpacing}px;
        word-spacing:${display.wordSpacing}px;
        max-width:${display.maxWidth}ch;
        ${display.openDyslexic ? "font-family:OpenDyslexic, Arial, sans-serif !important;" : ""}
      }
      .beta-eye-focus-ruler .beta-eye-simplified-text:hover{outline:3px solid #0f62fe;outline-offset:3px;}
      .beta-eye-sentence-pacing .beta-eye-simplified-text{margin-block:1.1em;}
      .beta-eye-theme-highContrast .beta-eye-simplified-text{background:#000;color:#fff;}
      .beta-eye-theme-soft .beta-eye-simplified-text{background:#f7fbff;color:#17202a;}
    `;
    document.documentElement.classList.toggle("beta-eye-focus-ruler", Boolean(display.focusRuler));
    document.documentElement.classList.toggle(
      "beta-eye-sentence-pacing",
      Boolean(display.sentencePacing),
    );
    document.documentElement.classList.toggle(
      "beta-eye-theme-highContrast",
      display.theme === "highContrast",
    );
    document.documentElement.classList.toggle("beta-eye-theme-soft", display.theme === "soft");
  }

  root.BetaEyeRenderer = { state, render, restoreAll, toggleOriginal, applyDisplay, renderChangeView };
  if (typeof module !== "undefined") module.exports = root.BetaEyeRenderer;
})(typeof globalThis !== "undefined" ? globalThis : window);
