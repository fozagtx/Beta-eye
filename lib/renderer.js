(function (root) {
  "use strict";

  const state = {
    simplified: false,
    records: new Map()
  };

  function render(record, simplifiedText, settings) {
    if (!state.records.has(record.element)) {
      state.records.set(record.element, { original: record.element.textContent });
    }
    record.element.dataset.seeSimplified = "true";
    record.element.dataset.seeOriginal = state.records.get(record.element).original;
    record.element.textContent = simplifiedText;
    record.element.classList.add("see-simplified-text");
    record.element.classList.toggle("see-show-changes", Boolean(settings.showChanges));
    state.simplified = true;
  }

  function restoreAll(rootNode) {
    for (const [element, record] of state.records.entries()) {
      if (rootNode.contains(element)) {
        element.textContent = record.original;
        element.classList.remove("see-simplified-text", "see-show-changes");
        delete element.dataset.seeSimplified;
        delete element.dataset.seeOriginal;
      }
    }
    state.simplified = false;
  }

  function toggleOriginal(rootNode) {
    if (state.simplified) {
      restoreAll(rootNode);
      return "original";
    }
    return "unchanged";
  }

  function applyDisplay(settings) {
    let style = document.getElementById("see-display-style");
    if (!style) {
      style = document.createElement("style");
      style.id = "see-display-style";
      document.documentElement.appendChild(style);
    }
    const display = settings.display;
    const fontFace = display.openDyslexic
      ? `@font-face{font-family:OpenDyslexic;src:url("${chrome.runtime.getURL("fonts/OpenDyslexic-Regular.woff2")}") format("woff2");font-display:swap;}`
      : "";
    style.textContent = `${fontFace}
      .see-simplified-text{
        line-height:${display.lineHeight};
        letter-spacing:${display.letterSpacing}px;
        word-spacing:${display.wordSpacing}px;
        max-width:${display.maxWidth}ch;
        ${display.openDyslexic ? "font-family:OpenDyslexic, Arial, sans-serif !important;" : ""}
      }
      .see-focus-ruler .see-simplified-text:hover{outline:3px solid #0f62fe;outline-offset:3px;}
      .see-theme-highContrast .see-simplified-text{background:#000;color:#fff;}
      .see-theme-soft .see-simplified-text{background:#f7fbff;color:#17202a;}
    `;
    document.documentElement.classList.toggle("see-focus-ruler", Boolean(display.focusRuler));
    document.documentElement.classList.toggle("see-theme-highContrast", display.theme === "highContrast");
    document.documentElement.classList.toggle("see-theme-soft", display.theme === "soft");
  }

  root.SeeRenderer = { state, render, restoreAll, toggleOriginal, applyDisplay };
  if (typeof module !== "undefined") module.exports = root.SeeRenderer;
})(typeof globalThis !== "undefined" ? globalThis : window);
