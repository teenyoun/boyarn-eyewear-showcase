/* ============================================================
   BOYARN catalog — behaviour
   ============================================================ */
(function () {
  "use strict";

  var ALL = "All";
  var PAGE = 48;
  var products = (window.BOYARN_PRODUCTS || []).filter(function (p) { return p && p.name; });

  var state = { cat: ALL, sort: "default", limit: PAGE };

  var grid = document.getElementById("grid");
  var chips = document.getElementById("chips");
  var empty = document.getElementById("empty");
  var resultCount = document.getElementById("resultCount");
  var loadMore = document.getElementById("loadMore");
  var modal = document.getElementById("modal");

  /* ---------- fallback artwork (only if a style has no photo) ---------- */
  function framePaths(shape) {
    switch (shape) {
      case "Round":   return two("circle", { cx: 85, cy: 65, r: 42 }, { cx: 215, cy: 65, r: 42 });
      case "Oval":    return two("ellipse", { cx: 85, cy: 65, rx: 46, ry: 36 }, { cx: 215, cy: 65, rx: 46, ry: 36 });
      case "Square":  return two("rect", { x: 46, y: 26, width: 82, height: 78, rx: 6 }, { x: 172, y: 26, width: 82, height: 78, rx: 6 });
      case "Hexagon": return two("polygon", { points: poly(85, 65, 48, 44, 6) }, { points: poly(215, 65, 48, 44, 6) });
      case "Polygon": return two("polygon", { points: poly(85, 65, 50, 46, 8) }, { points: poly(215, 65, 50, 46, 8) });
      default:        return two("rect", { x: 38, y: 34, width: 94, height: 62, rx: 12 }, { x: 168, y: 34, width: 94, height: 62, rx: 12 });
    }
  }
  function two(tag, a, b) { return "<" + tag + at(a) + "/><" + tag + at(b) + "/>"; }
  function at(o) {
    return Object.keys(o).map(function (k) { return " " + k + '="' + o[k] + '"'; }).join("");
  }
  function poly(cx, cy, rx, ry, n) {
    var p = [];
    for (var i = 0; i < n; i++) {
      var a = ((Math.PI * 2) / n) * i - Math.PI / 2;
      p.push((cx + rx * Math.cos(a)).toFixed(1) + "," + (cy + ry * Math.sin(a)).toFixed(1));
    }
    return p.join(" ");
  }
  function art(p) {
    return '<svg viewBox="0 0 300 130" role="img" aria-label="' + esc(p.name) + '">' +
      '<g fill="#8FA0A4" fill-opacity=".2" stroke="#1A1714" stroke-width="7" stroke-linejoin="round">' +
      framePaths(p.shape) + "</g>" +
      '<path d="M131 58 Q150 50 169 58" fill="none" stroke="#1A1714" stroke-width="7" stroke-linecap="round"/>' +
      "</svg>";
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  function money(n) { return "$" + Number(n).toFixed(2); }

  function priceLabel(p) {
    if (p.fobLow == null) return "Ask<em>FOB</em>";
    if (p.fobLow === p.fobHigh) return money(p.fobLow) + "<em>FOB</em>";
    return money(p.fobLow) + "&ndash;" + money(p.fobHigh) + "<em>FOB</em>";
  }

  function media(p, cls) {
    if (p.img) {
      return '<div class="' + cls + ' has-photo"><img src="' + esc(p.img) + '" alt="' + esc(p.name) +
        '" loading="lazy" referrerpolicy="no-referrer"></div>';
    }
    return '<div class="' + cls + '">' + art(p) + "</div>";
  }

  /* ---------- chips ---------- */
  function buildChips() {
    var counts = {};
    products.forEach(function (p) { counts[p.category] = (counts[p.category] || 0) + 1; });
    var order = ["Sunglasses", "Optical Frames", "Reading", "Kids", "Accessories"];
    var cats = [ALL].concat(order.filter(function (c) { return counts[c]; }))
      .concat(Object.keys(counts).filter(function (c) { return order.indexOf(c) < 0; }));
    chips.innerHTML = cats.map(function (c) {
      var n = c === ALL ? products.length : counts[c];
      return '<button class="chip' + (state.cat === c ? " is-active" : "") +
        '" data-cat="' + esc(c) + '">' + esc(c) + ' <span class="chip-n">' + n + "</span></button>";
    }).join("");
  }

  /* ---------- grid ---------- */
  function list() {
    var l = products.filter(function (p) { return state.cat === ALL || p.category === state.cat; });
    if (state.sort === "low") l.sort(function (a, b) { return (a.fobLow == null ? 1e9 : a.fobLow) - (b.fobLow == null ? 1e9 : b.fobLow); });
    if (state.sort === "high") l.sort(function (a, b) { return (b.fobLow == null ? -1 : b.fobLow) - (a.fobLow == null ? -1 : a.fobLow); });
    return l;
  }

  function render() {
    var l = list();
    var shown = l.slice(0, state.limit);

    empty.hidden = l.length > 0;
    resultCount.textContent = (l.length === products.length
      ? l.length + " styles"
      : l.length + " of " + products.length + " styles");

    grid.innerHTML = shown.map(function (p) {
      return (
        '<button class="card" data-id="' + esc(p.id) + '" aria-label="' + esc(p.name) + '">' +
        media(p, "card-media") +
        '<div class="card-body">' +
        '<span class="pill">' + esc(p.category) + "</span>" +
        '<p class="card-title">' + esc(p.name) + "</p>" +
        '<div class="card-meta">' +
        '<span class="card-price">' + priceLabel(p) + "</span>" +
        '<span class="card-code">' + esc(p.id) + "</span>" +
        "</div></div></button>"
      );
    }).join("");

    loadMore.hidden = shown.length >= l.length;
  }

  /* ---------- modal ---------- */
  function row(k, v) {
    if (!v) return "";
    return "<div><dt>" + esc(k) + "</dt><dd>" + esc(v) + "</dd></div>";
  }
  function openModal(id) {
    var p = products.filter(function (x) { return x.id === id; })[0];
    if (!p) return;
    var mm = document.getElementById("modalMedia");
    mm.className = "modal-media" + (p.img ? " has-photo" : "");
    mm.innerHTML = p.img
      ? '<img src="' + esc(p.img) + '" alt="' + esc(p.name) + '" referrerpolicy="no-referrer">'
      : art(p);
    document.getElementById("modalCat").textContent = p.category;
    document.getElementById("modalTitle").textContent = p.name;
    document.getElementById("modalSpec").innerHTML =
      row("Style code", p.id) +
      row("Category", p.category) +
      row("Shape", p.shape) +
      row("Material", p.material) +
      row("FOB", p.fobLow == null ? "On request" : (p.fobLow === p.fobHigh ? money(p.fobLow) : money(p.fobLow) + " – " + money(p.fobHigh)));
    document.getElementById("modalQuote").href =
      "mailto:REPLACE@example.com?subject=" + encodeURIComponent("Quote request — " + p.id) +
      "&body=" + encodeURIComponent("Style code: " + p.id + "\nItem: " + p.name +
        "\nQuantity per colour: \nDestination market: \nLens required: \nLogo: yes / no\n");
    modal.hidden = false;
    document.body.style.overflow = "hidden";
  }
  function closeModal() {
    modal.hidden = true;
    document.body.style.overflow = "";
  }

  /* ---------- events ---------- */
  chips.addEventListener("click", function (e) {
    var b = e.target.closest(".chip");
    if (!b) return;
    state.cat = b.getAttribute("data-cat");
    state.limit = PAGE;
    buildChips();
    render();
  });

  document.querySelector(".sort").addEventListener("click", function (e) {
    var b = e.target.closest(".sort-btn");
    if (!b) return;
    state.sort = b.getAttribute("data-sort");
    Array.prototype.forEach.call(this.querySelectorAll(".sort-btn"), function (x) {
      x.classList.toggle("is-active", x === b);
    });
    render();
  });

  loadMore.addEventListener("click", function () {
    state.limit += PAGE;
    render();
  });

  grid.addEventListener("click", function (e) {
    var c = e.target.closest(".card");
    if (c) openModal(c.getAttribute("data-id"));
  });

  modal.addEventListener("click", function (e) {
    if (e.target.hasAttribute("data-close")) closeModal();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !modal.hidden) closeModal();
  });

  var navToggle = document.getElementById("navToggle");
  var navDrawer = document.getElementById("navDrawer");
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

  buildChips();
  render();
})();
