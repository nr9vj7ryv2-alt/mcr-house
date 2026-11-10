document.addEventListener('DOMContentLoaded', function () {
  const input = document.querySelector('.search-box input');
  const searchBox = document.querySelector('.search-box');
  if (!input || !searchBox || !Array.isArray(window.MCR_SEARCH_INDEX)) return;

  const results = document.createElement('div');
  results.className = 'search-results';
  results.id = 'mcrSearchResults';
  results.setAttribute('role', 'region');
  results.setAttribute('aria-label', 'Search results');
  searchBox.appendChild(results);
  input.setAttribute('aria-controls', results.id);
  input.setAttribute('aria-expanded', 'false');

  function clearResults() {
    results.replaceChildren();
    results.classList.remove('open');
    input.setAttribute('aria-expanded', 'false');
  }
  function openResults() {
    results.classList.add('open');
    input.setAttribute('aria-expanded', 'true');
  }
  function textSpan(className, value) {
    const span = document.createElement('span');
    span.className = className;
    span.textContent = String(value ?? '');
    return span;
  }
  function renderResults(matches, query) {
    results.replaceChildren();
    if (!matches.length) {
      const empty = document.createElement('div');
      empty.className = 'search-empty';
      empty.textContent = 'No activities found for "' + query + '"';
      results.appendChild(empty);
      openResults();
      return;
    }
    matches.slice(0, 8).forEach(function (item) {
      const row = document.createElement('div');
      row.className = 'search-result';
      const link = document.createElement('a');
      link.href = item.url;
      link.className = 'search-result-link';
      link.append(
        textSpan('search-result-title', item.title),
        textSpan('search-result-room', item.room),
        textSpan('search-result-desc', item.desc)
      );
      const heartBtn = document.createElement('button');
      heartBtn.type = 'button';
      heartBtn.className = 'search-favorite-btn';
      function updateHeart() {
        const favored = !!(window.MCR_FAVORITES && window.MCR_FAVORITES.isFavorited(item.title));
        heartBtn.textContent = favored ? '♥' : '♡';
        heartBtn.setAttribute('aria-label', (favored ? 'Remove from favorites: ' : 'Add to favorites: ') + item.title);
        heartBtn.setAttribute('aria-pressed', String(favored));
      }
      updateHeart();
      heartBtn.addEventListener('click', function () {
        if (!window.MCR_FAVORITES) return;
        window.MCR_FAVORITES.toggleFavorite(item);
        updateHeart();
      });
      row.append(link, heartBtn);
      results.appendChild(row);
    });
    openResults();
  }
  function doSearch() {
    const query = input.value.trim().toLowerCase();
    if (!query) return clearResults();
    const matches = window.MCR_SEARCH_INDEX.filter(function (item) {
      return [item.title, item.desc, item.room].some(function (value) {
        return String(value ?? '').toLowerCase().includes(query);
      });
    });
    renderResults(matches, input.value.trim());
  }
  input.addEventListener('input', doSearch);
  input.addEventListener('focus', function () { if (input.value.trim()) doSearch(); });
  input.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') { clearResults(); input.blur(); }
    if (event.key === 'ArrowDown' && results.classList.contains('open')) {
      const first = results.querySelector('a, button');
      if (first) { event.preventDefault(); first.focus(); }
    }
  });
  results.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') { clearResults(); input.focus(); }
  });
  document.addEventListener('click', function (event) {
    if (!searchBox.contains(event.target)) clearResults();
  });
});
