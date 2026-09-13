(function () {
  var STORAGE_KEY = "mcr_favorites";

  function getFavorites() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function saveFavorites(list) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      // localStorage unavailable (private browsing, etc.) - fail silently
    }
  }

  function isFavorited(title) {
    return getFavorites().some(function (f) { return f.title === title; });
  }

  function toggleFavorite(item) {
    var list = getFavorites();
    var index = list.findIndex(function (f) { return f.title === item.title; });
    var nowFavorited;
    if (index === -1) {
      list.push(item);
      nowFavorited = true;
    } else {
      list.splice(index, 1);
      nowFavorited = false;
    }
    saveFavorites(list);
    renderFavoritesPanel();
    return nowFavorited;
  }

  function renderFavoritesPanel() {
    var panel = document.getElementById("favoritesPanelBody");
    if (!panel) return;
    var list = getFavorites();
    panel.innerHTML = "";

    if (list.length === 0) {
      var empty = document.createElement("p");
      empty.className = "favorites-empty";
      empty.textContent = "No favorites yet. Search for an activity, then tap the heart to save it here.";
      panel.appendChild(empty);
      return;
    }

    list.forEach(function (item) {
      var row = document.createElement("a");
      row.href = item.url;
      row.className = "favorite-item";
      row.innerHTML =
        "<span class='favorite-item-title'>" + item.title + "</span>" +
        "<span class='favorite-item-room'>" + item.room + "</span>";
      panel.appendChild(row);
    });
  }

  // Expose globally so search.js can use it too
  window.MCR_FAVORITES = {
    isFavorited: isFavorited,
    toggleFavorite: toggleFavorite,
    render: renderFavoritesPanel
  };

  document.addEventListener("DOMContentLoaded", function () {
    renderFavoritesPanel();

    var openBtn = document.querySelector(".favorite-button");
    var panelWrap = document.getElementById("favoritesPanel");
    var closeBtn = document.getElementById("favoritesClose");

    if (openBtn && panelWrap) {
      openBtn.addEventListener("click", function () {
        panelWrap.classList.add("open");
        panelWrap.setAttribute("aria-hidden", "false");
        renderFavoritesPanel();
      });
    }
    if (closeBtn && panelWrap) {
      closeBtn.addEventListener("click", function () {
        panelWrap.classList.remove("open");
        panelWrap.setAttribute("aria-hidden", "true");
      });
    }
  });
})();
