(function () {
  const STORAGE_KEY = 'mcr_favorites';
  function getFavorites() {
    try {
      const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      return Array.isArray(value) ? value : [];
    } catch (error) { return []; }
  }
  function saveFavorites(list) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); }
    catch (error) { /* Favorites remain available until page reload. */ }
  }
  function identity(item) { return item.url || item.title; }
  function isFavorited(title) {
    return getFavorites().some(function (item) { return item.title === title; });
  }
  function toggleFavorite(item) {
    const list = getFavorites();
    const index = list.findIndex(function (saved) { return identity(saved) === identity(item); });
    const nowFavorited = index === -1;
    if (nowFavorited) list.push(item);
    else list.splice(index, 1);
    saveFavorites(list);
    renderFavoritesPanel();
    return nowFavorited;
  }
  function renderFavoritesPanel() {
    const body = document.getElementById('favoritesPanelBody');
    if (!body) return;
    body.replaceChildren();
    const list = getFavorites();
    if (!list.length) {
      const empty = document.createElement('p');
      empty.className = 'favorites-empty';
      empty.textContent = 'No favorites yet. Search for an activity, then tap the heart to save it here.';
      body.appendChild(empty);
      return;
    }
    list.forEach(function (item) {
      const link = document.createElement('a');
      link.href = item.url;
      link.className = 'favorite-item';
      const title = document.createElement('span');
      title.className = 'favorite-item-title';
      title.textContent = item.title;
      const room = document.createElement('span');
      room.className = 'favorite-item-room';
      room.textContent = item.room;
      link.append(title, room);
      body.appendChild(link);
    });
  }
  window.MCR_FAVORITES = { isFavorited, toggleFavorite, render: renderFavoritesPanel };
  document.addEventListener('DOMContentLoaded', function () {
    renderFavoritesPanel();
    const openBtn = document.querySelector('.favorite-button');
    const panel = document.getElementById('favoritesPanel');
    const closeBtn = document.getElementById('favoritesClose');
    if (!openBtn || !panel || !closeBtn) return;
    let previousFocus;
    function close() {
      panel.classList.remove('open');
      panel.setAttribute('aria-hidden', 'true');
      openBtn.setAttribute('aria-expanded', 'false');
      if (previousFocus && previousFocus.focus) previousFocus.focus();
    }
    openBtn.addEventListener('click', function () {
      previousFocus = document.activeElement;
      panel.classList.add('open');
      panel.setAttribute('aria-hidden', 'false');
      openBtn.setAttribute('aria-expanded', 'true');
      renderFavoritesPanel();
      closeBtn.focus();
    });
    closeBtn.addEventListener('click', close);
    panel.addEventListener('click', function (event) { if (event.target === panel) close(); });
    panel.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') { event.preventDefault(); close(); return; }
      if (event.key !== 'Tab') return;
      const focusable = [...panel.querySelectorAll('button:not([disabled]), a[href]')];
      if (!focusable.length) return;
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    });
  });
})();
