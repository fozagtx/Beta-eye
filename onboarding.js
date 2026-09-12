(function () {
  "use strict";

  document.getElementById("finish").addEventListener("click", async () => {
    await window.RedactoSettings.setOnboardingState(true);
    window.close();
  });
})();
