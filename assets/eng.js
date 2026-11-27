/* BOYARN 产品页互动：点赞 + 买家评价（数据由 api.boyarn.trade 提供） */
(function () {
  var API = "https://api.boyarn.trade";
  var root = document.querySelector("[data-eng]");
  if (!root) return;
  var ref = root.getAttribute("data-eng");
  if (!ref) return;

  /* ---------------- 点赞 ---------------- */
  var btn = root.querySelector(".like-btn");
  var num = root.querySelector(".like-n");
  var KEY = "boyarn-like-" + ref;

  function paintLike(n) {
    if (num) num.textContent = n;
    if (localStorage.getItem(KEY) === "1" && btn) {
      btn.classList.add("on");
      btn.setAttribute("aria-pressed", "true");
    }
  }

  if (btn) {
    fetch(API + "/api/likes/" + ref)
      .then(function (r) { return r.json(); })
      .then(function (d) { paintLike(d.count || 0); })
      .catch(function () {});

    btn.addEventListener("click", function () {
      if (localStorage.getItem(KEY) === "1") return;
      btn.disabled = true;
      fetch(API + "/api/likes/" + ref, { method: "POST" })
        .then(function (r) { return r.json(); })
        .then(function (d) {
          localStorage.setItem(KEY, "1");
          paintLike(d.count || 0);
          btn.disabled = false;
        })
        .catch(function () { btn.disabled = false; });
    });
  }

  /* ---------------- 评价 ---------------- */
  var box = root.querySelector(".rev-list");
  var sum = root.querySelector(".rev-sum");
  var form = root.querySelector(".rev-form form");
  var note = root.querySelector(".rev-note");

  function stars(n) {
    var s = "", i;
    for (i = 1; i <= 5; i++) s += i <= n ? "★" : "☆";
    return s;
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function load() {
    if (!box) return;
    fetch(API + "/api/reviews/" + ref)
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (sum) {
          sum.innerHTML = d.count
            ? '<b>' + d.avg.toFixed(1) + "</b> " + stars(Math.round(d.avg)) + ' <span>' + d.count + " review" + (d.count > 1 ? "s" : "") + "</span>"
            : "No reviews yet";
        }
        box.innerHTML = (d.items || []).map(function (v) {
          return (
            '<article class="rev-item"><div class="rev-h">' +
            '<span class="rev-st">' + stars(v.rating) + "</span>" +
            "<b>" + esc(v.name) + "</b>" +
            (v.country ? '<span class="rev-c">' + esc(v.country) + "</span>" : "") +
            '<time>' + esc((v.created_at || "").slice(0, 10)) + "</time></div>" +
            "<p>" + esc(v.body) + "</p></article>"
          );
        }).join("");
      })
      .catch(function () {});
  }
  load();

  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var fd = new FormData(form);
      var payload = {
        rating: fd.get("rating"),
        name: fd.get("name"),
        email: fd.get("email"),
        country: fd.get("country"),
        body: fd.get("body"),
        website: fd.get("website")
      };
      if (note) { note.textContent = "Sending…"; note.className = "rev-note"; }
      fetch(API + "/api/reviews/" + ref, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
        .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
        .then(function (res) {
          if (!note) return;
          if (res.ok) {
            note.textContent = "Thank you — your review is queued for approval.";
            note.className = "rev-note ok";
            form.reset();
          } else {
            note.textContent = res.d.error || "Something went wrong, please retry.";
            note.className = "rev-note err";
          }
        })
        .catch(function () {
          if (note) { note.textContent = "Network error, please retry."; note.className = "rev-note err"; }
        });
    });
  }
})();
