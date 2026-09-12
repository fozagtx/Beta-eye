(function () {
  "use strict";

  document.getElementById("finish").addEventListener("click", async () => {
    await window.SeeSettings.setOnboardingState(true);
    window.close();
  });
})();
