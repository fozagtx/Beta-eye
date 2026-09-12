(function (root) {
  "use strict";

  function textOnly(value) {
    return String(value || "").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");
  }

  root.SeeSanitizer = { textOnly };
  if (typeof module !== "undefined") module.exports = root.SeeSanitizer;
})(typeof globalThis !== "undefined" ? globalThis : window);
