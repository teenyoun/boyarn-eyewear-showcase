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


  /* ---------------- 样品费 ---------------- */
  var sb = document.querySelector("[data-sample]");
  if (sb) {
    fetch(API + "/api/config")
      .then(function (r) { return r.json(); })
      .then(function (cfg) {
        if (!cfg.payments) return;
        var fee = (cfg.sampleFee / 100).toFixed(2);
        sb.querySelector(".sb-fee").textContent = "$" + fee;
        sb.hidden = false;
        var btn = sb.querySelector(".sb-btn");
        btn.addEventListener("click", function () {
          var qty = sb.querySelector(".sb-qty").value;
          btn.disabled = true;
          btn.textContent = "Opening Stripe...";
          fetch(API + "/api/sample-checkout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ref: sb.getAttribute("data-sample"), qty: parseInt(qty, 10) })
          })
            .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
            .then(function (res) {
              if (res.ok && res.d.url) { location.href = res.d.url; return; }
              btn.disabled = false;
              btn.textContent = "Pay $" + fee + " by card";
              alert(res.d.error === "payments not configured"
                ? "Card payment is not switched on yet. Please message us on WhatsApp."
                : "Payment could not start: " + (res.d.error || "unknown error"));
            })
            .catch(function () {
              btn.disabled = false;
              btn.textContent = "Pay $" + fee + " by card";
              alert("Network error, please retry.");
            });
        });
      })
      .catch(function () {});
  }

  /* 支付成功返回 */
  if (location.search.indexOf("paid=1") > -1) {
    var banner = document.createElement("div");
    banner.className = "pay-ok";
    banner.textContent = "Payment received. We will email sample dispatch details shortly.";
    var anchor = document.querySelector(".pdp-actions");
    if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(banner, anchor);
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
