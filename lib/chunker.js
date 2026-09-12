(function (root) {
  "use strict";

  const READABLE_SELECTOR = "article, main, [role='main'], .article, .post, .content, body";
  const TEXT_SELECTOR = "p, li, blockquote, figcaption";
  const SKIP_SELECTOR =
    "script, style, nav, footer, header, aside, form, input, textarea, select, button, pre, code, kbd, samp, [contenteditable='true'], [aria-hidden='true']";

  function collectReadableText(rootNode) {
    const scope = rootNode.querySelector(READABLE_SELECTOR) || rootNode.body || rootNode;
    const elements = Array.from(scope.querySelectorAll(TEXT_SELECTOR));
    return elements
      .filter((element) => isMeaningful(element))
      .map((element) => ({
        element,
        text: element.textContent.trim(),
        hash: hashText(element.textContent),
      }));
  }

  function isMeaningful(element) {
    if (element.closest(SKIP_SELECTOR)) return false;
    const text = element.textContent.trim();
    if (text.length < 60) return false;
    if (/^(by|published|updated|copyright|sign in|subscribe)\b/i.test(text)) return false;
    return true;
  }

  function hashText(text) {
    let hash = 2166136261;
    for (let index = 0; index < text.length; index += 1) {
      hash ^= text.charCodeAt(index);
      hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
    }
    return (hash >>> 0).toString(16);
  }

  root.BetaEyeChunker = { collectReadableText, isMeaningful, hashText };
  if (typeof module !== "undefined") module.exports = root.BetaEyeChunker;
})(typeof globalThis !== "undefined" ? globalThis : window);
