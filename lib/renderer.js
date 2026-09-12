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
    record.element.dataset.redactoSimplified = "true";
    record.element.dataset.redactoOriginal = state.records.get(record.element).original;
    if (settings.showChanges) {
      renderChangeView(record.element, state.records.get(record.element).original, simplifiedText);
    } else {
      record.element.textContent = simplifiedText;
    }
    record.element.classList.add("redacto-simplified-text");
    record.element.classList.toggle("redacto-show-changes", Boolean(settings.showChanges));
    state.simplified = true;
  }

  function restoreAll(rootNode) {
    for (const [element, record] of state.records.entries()) {
      if (rootNode.contains(element)) {
        element.textContent = record.original;
        element.classList.remove("redacto-simplified-text", "redacto-show-changes");
        delete element.dataset.redactoSimplified;
        delete element.dataset.redactoOriginal;
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
        marker.className = "redacto-change-token";
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
    let style = document.getElementById("redacto-display-style");
    if (!style) {
      style = document.createElement("style");
      style.id = "redacto-display-style";
      document.documentElement.appendChild(style);
    }
    const display = settings.display;
    const fontFace = display.openDyslexic
      ? `@font-face{font-family:OpenDyslexic;src:url("${chrome.runtime.getURL("fonts/OpenDyslexic-Regular.woff2")}") format("woff2");font-display:swap;}`
      : "";
    style.textContent = `${fontFace}
      .redacto-simplified-text{
        line-height:${display.lineHeight};
        letter-spacing:${display.letterSpacing}px;
        word-spacing:${display.wordSpacing}px;
        max-width:${display.maxWidth}ch;
        ${display.openDyslexic ? "font-family:OpenDyslexic, Arial, sans-serif !important;" : ""}
      }
      .redacto-focus-ruler .redacto-simplified-text:hover{outline:3px solid #0f62fe;outline-offset:3px;}
      .redacto-sentence-pacing .redacto-simplified-text{margin-block:1.1em;}
      .redacto-theme-highContrast .redacto-simplified-text{background:#000;color:#fff;}
      .redacto-theme-soft .redacto-simplified-text{background:#f7fbff;color:#17202a;}
    `;
    document.documentElement.classList.toggle("redacto-focus-ruler", Boolean(display.focusRuler));
    document.documentElement.classList.toggle(
      "redacto-sentence-pacing",
      Boolean(display.sentencePacing),
    );
    document.documentElement.classList.toggle(
      "redacto-theme-highContrast",
      display.theme === "highContrast",
    );
    document.documentElement.classList.toggle("redacto-theme-soft", display.theme === "soft");
  }

  root.RedactoRenderer = { state, render, restoreAll, toggleOriginal, applyDisplay, renderChangeView };
  if (typeof module !== "undefined") module.exports = root.RedactoRenderer;
})(typeof globalThis !== "undefined" ? globalThis : window);
