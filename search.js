document.addEventListener("DOMContentLoaded", function () {
  var input = document.querySelector(".search-box input");
  var searchBox = document.querySelector(".search-box");
  if (!input || !searchBox || typeof MCR_SEARCH_INDEX === "undefined") return;

  // Create the results dropdown and nest it INSIDE the search box
  // (not as a topbar sibling, which would break the 3-column grid layout)
  var results = document.createElement("div");
  results.className = "search-results";
  results.setAttribute("role", "listbox");
  searchBox.style.position = "relative";
  searchBox.appendChild(results);

  function clearResults() {
    results.innerHTML = "";
    results.classList.remove("open");
  }

  function renderResults(matches, query) {
    results.innerHTML = "";
    if (matches.length === 0) {
      var empty = document.createElement("div");
      empty.className = "search-empty";
      empty.textContent = "No activities found for \"" + query + "\"";
      results.appendChild(empty);
      results.classList.add("open");
      return;
    }

    matches.slice(0, 8).forEach(function (item) {
      var row = document.createElement("div");
      row.className = "search-result";

      var link = document.createElement("a");
      link.href = item.url;
      link.className = "search-result-link";
      link.innerHTML =
        "<span class='search-result-title'>" + item.title + "</span>" +
        "<span class='search-result-room'>" + item.room + "</span>" +
        "<span class='search-result-desc'>" + item.desc + "</span>";

      var heartBtn = document.createElement("button");
      heartBtn.type = "button";
      heartBtn.className = "search-favorite-btn";
      var favored = window.MCR_FAVORITES && window.MCR_FAVORITES.isFavorited(item.title);
      heartBtn.textContent = favored ? "♥" : "♡";
      heartBtn.setAttribute("aria-label", favored ? "Remove from favorites" : "Add to favorites");
      heartBtn.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        if (!window.MCR_FAVORITES) return;
        var nowFav = window.MCR_FAVORITES.toggleFavorite(item);
        heartBtn.textContent = nowFav ? "♥" : "♡";
        heartBtn.setAttribute("aria-label", nowFav ? "Remove from favorites" : "Add to favorites");
      });

      row.appendChild(link);
      row.appendChild(heartBtn);
      results.appendChild(row);
    });

    results.classList.add("open");
  }

  function doSearch() {
    var query = input.value.trim().toLowerCase();
    if (query.length === 0) {
      clearResults();
      return;
    }

    var matches = MCR_SEARCH_INDEX.filter(function (item) {
      return (
        item.title.toLowerCase().indexOf(query) !== -1 ||
        item.desc.toLowerCase().indexOf(query) !== -1 ||
        item.room.toLowerCase().indexOf(query) !== -1
      );
    });

    renderResults(matches, input.value.trim());
  }

  input.addEventListener("input", doSearch);
  input.addEventListener("focus", function () {
    if (input.value.trim().length > 0) doSearch();
  });

  // Close the dropdown when clicking anywhere outside the search box/results
  document.addEventListener("click", function (e) {
    if (!searchBox.contains(e.target)) {
      clearResults();
    }
  });

  // Close on Escape
  input.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      clearResults();
      input.blur();
    }
  });
});
