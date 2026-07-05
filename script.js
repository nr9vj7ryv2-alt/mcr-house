const openButton = document.getElementById("adaptOpen");
const closeButton = document.getElementById("adaptClose");
const panel = document.getElementById("adaptPanel");

openButton.addEventListener("click", () => {
  panel.classList.add("open");
  panel.setAttribute("aria-hidden", "false");
});

closeButton.addEventListener("click", () => {
  panel.classList.remove("open");
  panel.setAttribute("aria-hidden", "true");
});

document.querySelectorAll("[data-setting]").forEach((button) => {
  button.addEventListener("click", () => {
    const setting = button.dataset.setting;

    if (setting === "largeText") document.body.classList.toggle("large-text");
    if (setting === "highContrast") document.body.classList.toggle("high-contrast");
    if (setting === "reduceMotion") document.body.classList.toggle("reduce-motion");
    if (setting === "simpleFont") document.body.classList.toggle("simple-font");
  });
});
