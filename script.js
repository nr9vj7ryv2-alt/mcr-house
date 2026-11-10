// ADApt controls. Other scripts continue to manage Search and Favorites.
(() => {
  const openButton = document.getElementById("adaptOpen");
  const closeButton = document.getElementById("adaptClose");
  const panel = document.getElementById("adaptPanel");
  if (!openButton || !closeButton || !panel) return;

  const settings = {
    largeText: "large-text",
    highContrast: "high-contrast",
    reduceMotion: "reduce-motion",
    simpleFont: "simple-font"
  };
  const storageKey = "mcr-adapt-settings";
  let previousFocus = null;

  function updatePressed() {
    panel.querySelectorAll("[data-setting]").forEach(button => {
      const cssClass = settings[button.dataset.setting];
      if (cssClass) button.setAttribute("aria-pressed", String(document.body.classList.contains(cssClass)));
    });
  }

  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || "{}");
    for (const [key, cssClass] of Object.entries(settings)) {
      document.body.classList.toggle(cssClass, saved[key] === true);
    }
  } catch (error) {
    // Private browsing or blocked storage should not disable accessibility controls.
  }
  updatePressed();

  function openPanel() {
    previousFocus = document.activeElement;
    panel.classList.add("open");
    panel.setAttribute("aria-hidden", "false");
    openButton.setAttribute("aria-expanded", "true");
    closeButton.focus();
  }

  function closePanel() {
    panel.classList.remove("open");
    panel.setAttribute("aria-hidden", "true");
    openButton.setAttribute("aria-expanded", "false");
    if (previousFocus && typeof previousFocus.focus === "function") previousFocus.focus();
  }

  openButton.addEventListener("click", openPanel);
  closeButton.addEventListener("click", closePanel);
  panel.addEventListener("click", event => {
    if (event.target === panel) closePanel();
  });
  panel.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      event.preventDefault();
      closePanel();
      return;
    }
    if (event.key !== "Tab") return;
    const focusable = Array.from(panel.querySelectorAll('button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled])'));
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  panel.querySelectorAll("[data-setting]").forEach(button => {
    button.addEventListener("click", () => {
      const cssClass = settings[button.dataset.setting];
      if (!cssClass) return;
      document.body.classList.toggle(cssClass);
      updatePressed();
      try {
        const saved = {};
        for (const [key, name] of Object.entries(settings)) saved[key] = document.body.classList.contains(name);
        localStorage.setItem(storageKey, JSON.stringify(saved));
      } catch (error) {
        // Settings still work for this page when storage is unavailable.
      }
    });
  });
})();
