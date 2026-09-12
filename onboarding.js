(function () {
  "use strict";

  document.getElementById("finish").addEventListener("click", async () => {
    await window.BetaEyeSettings.setOnboardingState(true);
    window.close();
  });
})();
