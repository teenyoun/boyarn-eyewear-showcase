/* ============================================================
   BOYARN catalog — behaviour
   Cards are static HTML (so search engines and no-JS visitors
   see the full catalogue). This file only filters, sorts and
   paginates what is already on the page.
   ============================================================ */
(function () {
  "use strict";

  var PAGE = 48;
  var grid = document.getElementById("grid");
  if (!grid) return;

  var cards = Array.prototype.slice.call(grid.querySelectorAll(".card"));
  var chips = document.getElementById("chips");
  var empty = document.getElementById("empty");
  var resultCount = document.getElementById("resultCount");
  var loadMore = document.getElementById("loadMore");
  var skuToggle = document.getElementById("skuToggle");

  var state = { cat: "All", sort: "default", limit: PAGE };
  var total = cards.length;

  /* ---------- sku visibility ---------- */
  try {
    var saved = window.localStorage.getItem("boyarn_sku");
    if (saved === "0" && skuToggle) skuToggle.checked = false;
  } catch (err) { /* storage blocked — keep the default */ }
  applySku();

  function applySku() {
    var on = !skuToggle || skuToggle.checked;
    grid.classList.toggle("show-sku", on);
    try { window.localStorage.setItem("boyarn_sku", on ? "1" : "0"); } catch (err) {}
  }

  /* ---------- filter + sort ---------- */
  function ordered() {
    var list = cards.filter(function (c) {
      return state.cat === "All" || c.getAttribute("data-cat") === state.cat;
    });
    if (state.sort === "low") {
      list.sort(function (a, b) { return +a.dataset.price - +b.dataset.price; });
    } else if (state.sort === "high") {
      list.sort(function (a, b) { return +b.dataset.price - +a.dataset.price; });
    }
    return list;
  }

  function render() {
    var list = ordered();
    var shown = {};
    list.slice(0, state.limit).forEach(function (c) { shown[c.dataset.id] = true; });

    cards.forEach(function (c) {
      c.classList.toggle("is-hidden", !shown[c.dataset.id]);
    });

    empty.hidden = list.length > 0;
    resultCount.textContent = (list.length === total)
      ? total + " styles"
      : list.length + " of " + total + " styles";
    loadMore.hidden = state.limit >= list.length;
  }

  /* ---------- events ---------- */
  if (chips) {
    chips.addEventListener("click", function (e) {
      var b = e.target.closest(".chip");
      if (!b) return;
      state.cat = b.getAttribute("data-cat");
      state.limit = PAGE;
      Array.prototype.forEach.call(chips.querySelectorAll(".chip"), function (x) {
        x.classList.toggle("is-active", x === b);
      });
      render();
    });
  }

  var sortBar = document.querySelector(".sort");
  if (sortBar) {
    sortBar.addEventListener("click", function (e) {
      var b = e.target.closest(".sort-btn");
      if (!b) return;
      state.sort = b.getAttribute("data-sort");
      Array.prototype.forEach.call(sortBar.querySelectorAll(".sort-btn"), function (x) {
        x.classList.toggle("is-active", x === b);
      });
      render();
    });
  }

  if (loadMore) {
    loadMore.addEventListener("click", function () {
      state.limit += PAGE;
      render();
    });
  }

  if (skuToggle) skuToggle.addEventListener("change", applySku);

  /* ---------- mobile nav (also used on product pages) ---------- */
  var navToggle = document.getElementById("navToggle");
  var navDrawer = document.getElementById("navDrawer");
  if (navToggle && navDrawer) {
    navToggle.addEventListener("click", function () {
      var open = navDrawer.hidden;
      navDrawer.hidden = !open;
      navToggle.setAttribute("aria-expanded", String(open));
    });
    navDrawer.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        navDrawer.hidden = true;
        navToggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  render();
})();
