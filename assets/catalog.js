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
