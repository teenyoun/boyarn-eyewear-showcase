/* BOYARN catalogue - gallery + menu */
(function () {
  "use strict";

  /* ---- mobile menu ---- */
  var burger = document.querySelector("[data-burger]");
  var nav = document.querySelector("[data-nav]");
  if (burger && nav) {
    burger.addEventListener("click", function () {
      var open = nav.getAttribute("data-open") === "true";
      nav.setAttribute("data-open", open ? "false" : "true");
      burger.setAttribute("aria-expanded", open ? "false" : "true");
    });
  }

  /* ---- product gallery ---- */
  var main = document.getElementById("galImg");
  var strip = document.querySelector("[data-thumbs]");
  if (!main || !strip) return;

  var thumbs = [].slice.call(strip.querySelectorAll("button"));
  if (!thumbs.length) return;

  var count = thumbs.length;
  var index = 0;

  function show(i) {
    index = (i + count) % count;
    var src = thumbs[index].querySelector("img").getAttribute("src");
    main.setAttribute("src", src.replace("/assets/t/", "/assets/p/"));
    thumbs.forEach(function (b, n) {
      b.setAttribute("aria-current", n === index ? "true" : "false");
    });
  }

  thumbs.forEach(function (b, n) {
    b.addEventListener("click", function () { show(n); });
  });

  document.querySelectorAll("[data-step]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      show(index + parseInt(btn.getAttribute("data-step"), 10));
    });
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "ArrowLeft") show(index - 1);
    if (e.key === "ArrowRight") show(index + 1);
  });

  /* swipe on touch devices */
  var startX = null;
  main.addEventListener("touchstart", function (e) {
    startX = e.touches[0].clientX;
  }, { passive: true });
  main.addEventListener("touchend", function (e) {
    if (startX === null) return;
    var dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 44) show(index + (dx < 0 ? 1 : -1));
    startX = null;
  }, { passive: true });

  /* preload the rest so the next swipe is instant */
  thumbs.slice(1).forEach(function (b) {
    var im = new Image();
    im.src = b.querySelector("img").getAttribute("src").replace("/assets/t/", "/assets/p/");
  });
})();

/* ---- lightbox: swatches and the main gallery both open full size ---- */
(function () {
  var swBtns = [].slice.call(document.querySelectorAll(".sw-btn"));
  var gal = document.getElementById("galImg");
  var hasGallery = gal && gal.getAttribute("data-gallery");
  if (!swBtns.length && !hasGallery) return;

  var box = document.createElement("div");
  box.className = "lightbox";
  box.setAttribute("data-open", "false");
  box.setAttribute("role", "dialog");
  box.setAttribute("aria-modal", "true");
  box.innerHTML =
    '<button type="button" class="lb-close" aria-label="Close">&times;</button>' +
    '<button type="button" class="lb-nav lb-prev" aria-label="Previous">&#8249;</button>' +
    '<img alt="">' +
    '<p class="lb-name"></p>' +
    '<button type="button" class="lb-nav lb-next" aria-label="Next">&#8250;</button>';
  document.body.appendChild(box);

  var img = box.querySelector("img");
  var cap = box.querySelector(".lb-name");
  var cur = 0;
  var list = [];

  function show(i) {
    if (!list.length) return;
    cur = (i + list.length) % list.length;
    img.src = list[cur].src;
    img.alt = list[cur].name || "";
    cap.textContent = list[cur].name || "";
  }

  function open(items, i) {
    list = items;
    show(i);
    box.setAttribute("data-open", "true");
    document.body.style.overflow = "hidden";
  }

  function close() {
    box.setAttribute("data-open", "false");
    document.body.style.overflow = "";
    img.removeAttribute("src");
  }

  if (swBtns.length) {
    var swatches = swBtns.map(function (b) {
      return { src: b.getAttribute("data-large"), name: b.getAttribute("data-name") || "" };
    });
    swBtns.forEach(function (b, i) {
      b.addEventListener("click", function () { open(swatches, i); });
    });
  }

  if (hasGallery) {
    var urls = [];
    try { urls = JSON.parse(gal.getAttribute("data-gallery")) || []; } catch (e) { urls = []; }
    if (urls.length) {
      var shots = urls.map(function (u, n) { return { src: u, name: "Photo " + (n + 1) }; });
      gal.addEventListener("click", function () {
        var at = urls.indexOf(gal.getAttribute("src"));
        open(shots, at < 0 ? 0 : at);
      });
    }
  }

  box.querySelector(".lb-close").addEventListener("click", close);
  box.querySelector(".lb-prev").addEventListener("click", function (e) { e.stopPropagation(); show(cur - 1); });
  box.querySelector(".lb-next").addEventListener("click", function (e) { e.stopPropagation(); show(cur + 1); });
  box.addEventListener("click", function (e) {
    if (e.target === box) close();
  });
  document.addEventListener("keydown", function (e) {
    if (box.getAttribute("data-open") !== "true") return;
    if (e.key === "Escape") close();
    if (e.key === "ArrowLeft") show(cur - 1);
    if (e.key === "ArrowRight") show(cur + 1);
  });
})();

/* ---- hero rotation ---- */
(function () {
  var art = document.querySelector(".hero-art");
  if (!art) return;
  var slides = art.querySelectorAll(".hero-slide");
  if (slides.length < 2) return;
  var i = 0;
  setInterval(function () {
    slides[i].classList.remove("on");
    i = (i + 1) % slides.length;
    slides[i].classList.add("on");
  }, 5000);
})();
