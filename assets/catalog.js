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

/* ---- swatch lightbox ---- */
(function () {
  var btns = document.querySelectorAll(".sw-btn");
  if (!btns.length) return;

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
  var list = Array.prototype.slice.call(btns);
  var cur = 0;

  function show(i) {
    cur = (i + list.length) % list.length;
    var b = list[cur];
    img.src = b.getAttribute("data-large");
    img.alt = b.getAttribute("data-name") || "";
    cap.textContent = b.getAttribute("data-name") || "";
  }

  function open(i) {
    show(i);
    box.setAttribute("data-open", "true");
    document.body.style.overflow = "hidden";
  }

  function close() {
    box.setAttribute("data-open", "false");
    document.body.style.overflow = "";
    img.removeAttribute("src");
  }

  list.forEach(function (b, i) {
    b.addEventListener("click", function () { open(i); });
  });

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
