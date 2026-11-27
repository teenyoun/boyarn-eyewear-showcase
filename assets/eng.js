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


  /* ---------------- 样品车：加入 ---------------- */
  var sb = document.querySelector("[data-sample]");
  if (sb) {
    var ref = sb.getAttribute("data-sample");
    fetch(API + "/api/config")
      .then(function (r) { return r.json(); })
      .then(function (cfg) {
        if (!cfg.payments) return;
        var btn = sb.querySelector(".sb-btn");
        var sel = sb.querySelector(".sb-color");
        var qty = sb.querySelector(".sb-qty");

        // 颜色下拉：从页面已有的实拍色卡按钮读取，索引与服务端 skus.js 一致
        var sw = [].slice.call(document.querySelectorAll(".sw-btn"));
        if (sw.length) {
          sel.innerHTML = sw.map(function (b, n) {
            var nm = b.getAttribute("data-name") || ("Colour " + (n + 1));
            return '<option value="' + n + '">' + nm.replace(/[<>&]/g, "") + "</option>";
          }).join("");
        } else {
          sel.innerHTML = '<option value="-1">As shown</option>';
        }

        sb.hidden = false;
        btn.disabled = false;
        btn.addEventListener("click", function () {
          var n = parseInt(qty.value, 10) || 1;
          var idx = parseInt(sel.value, 10);
          var cname = sel.options[sel.selectedIndex] ? sel.options[sel.selectedIndex].text : "";
          var feeNode = sb.querySelector(".sb-fee");
          var feeTxt = feeNode ? feeNode.textContent : "";
          BoyarnCart.add({ ref: ref, i: idx, c: cname, qty: n });
          btn.textContent = "Added \u2713";
          setTimeout(function () {
            btn.innerHTML = 'Add to sample cart \u00b7 <b class="sb-fee">' + feeTxt + "</b> each";
          }, 1400);
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

/* ---------------- 样品车：存储 / 浮动入口 / 购物车页 ---------------- */
var BoyarnCart = (function () {
  var KEY = "boyarn-cart";
  var API = "https://api.boyarn.trade";

  function read() {
    try {
      var a = JSON.parse(localStorage.getItem(KEY) || "[]");
      return Array.isArray(a) ? a : [];
    } catch (e) { return []; }
  }
  function write(a) { localStorage.setItem(KEY, JSON.stringify(a)); }

  function count() {
    return read().reduce(function (n, it) { return n + (parseInt(it.qty, 10) || 1); }, 0);
  }

  function add(item) {
    var a = read();
    var hit = null;
    for (var k = 0; k < a.length; k++) {
      if (a[k].ref === item.ref && String(a[k].i) === String(item.i)) { hit = a[k]; break; }
    }
    if (hit) {
      hit.qty = Math.min(5, (parseInt(hit.qty, 10) || 1) + item.qty);
    } else {
      if (a.length >= 10) {
        alert("A sample order can hold up to 10 styles. Please check out first.");
        return;
      }
      a.push(item);
    }
    write(a);
    paint();
  }

  function remove(ref, i) {
    write(read().filter(function (it) { return !(it.ref === ref && String(it.i) === String(i)); }));
    paint();
  }

  function setQty(ref, i, q) {
    var a = read();
    a.forEach(function (it) {
      if (it.ref === ref && String(it.i) === String(i)) it.qty = Math.max(1, Math.min(5, q));
    });
    write(a);
    paint();
  }

  function shipCents(n) {
    if (n <= 0) return 0;
    if (n <= 2) return 2500;
    if (n <= 5) return 3800;
    if (n <= 10) return 5500;
    return 5500 + (n - 10) * 600;
  }

  function basePath() {
    var p = location.pathname;
    if (p.indexOf("/product/") > -1) return "../";
    return "";
  }

  /* 浮动入口 */
  function paint() {
    var n = count();
    var pill = document.getElementById("cartPill");
    if (!pill) {
      if (!n) return;
      pill = document.createElement("a");
      pill.id = "cartPill";
      pill.className = "cart-pill";
      document.body.appendChild(pill);
    }
    if (!n) { pill.style.display = "none"; return; }
    pill.style.display = "";
    pill.href = basePath() + "cart.html";
    pill.innerHTML = "Sample cart <b>" + n + "</b>";
  }

  return { read: read, write: write, add: add, remove: remove, setQty: setQty,
           count: count, shipCents: shipCents, paint: paint, base: basePath, API: API,
           KEY: KEY };
})();

/* 所有页面都挂上浮动入口 */
document.addEventListener("DOMContentLoaded", function () {
  BoyarnCart.paint();
  var root = document.getElementById("cart-root");
  if (!root) return;
  renderCart(root);
});

function renderCart(root) {
  var items = BoyarnCart.read();
  if (!items.length) {
    root.innerHTML = '<p class="cart-empty">Your sample cart is empty. ' +
      '<a href="' + BoyarnCart.base() + 'sunglasses.html">Browse the catalogue</a>.</p>';
    return;
  }
  fetch(BoyarnCart.base() + "assets/prices.json")
    .then(function (r) { return r.json(); })
    .then(function (px) {
      var subtotal = 0, totalQty = 0;
      var rows = items.map(function (it) {
        var unit = px[it.ref] || 0;
        var q = parseInt(it.qty, 10) || 1;
        subtotal += unit * q; totalQty += q;
        return '<tr data-ref="' + it.ref + '" data-i="' + it.i + '">' +
          '<td><a href="' + BoyarnCart.base() + 'product/' + it.ref + '.html">' + it.ref + "</a></td>" +
          "<td>" + (it.c || "As shown") + "</td>" +
          '<td><select class="c-qty">' +
          [1, 2, 3, 4, 5].map(function (n) {
            return '<option value="' + n + '"' + (n === q ? " selected" : "") + ">" + n + "</option>";
          }).join("") + "</select></td>" +
          "<td>$" + (unit / 100).toFixed(2) + "</td>" +
          "<td>$" + ((unit * q) / 100).toFixed(2) + "</td>" +
          '<td><button class="c-del" type="button">Remove</button></td></tr>';
      }).join("");

      var ship = BoyarnCart.shipCents(totalQty);
      var grand = subtotal + ship;
      root.innerHTML =
        '<table class="cart-table"><thead><tr><th>Style</th><th>Colour</th><th>Qty</th>' +
        "<th>Unit</th><th>Subtotal</th><th></th></tr></thead><tbody>" + rows + "</tbody></table>" +
        '<div class="cart-sum">' +
        "<p>Items <b>" + totalQty + "</b> pcs</p>" +
        "<p>Samples <b>$" + (subtotal / 100).toFixed(2) + "</b></p>" +
        "<p>Courier freight <b>$" + (ship / 100).toFixed(2) + "</b> " +
        '<span class="cart-note">(by total piece count)</span></p>' +
        "<p class=\"cart-total\">Total <b>$" + (grand / 100).toFixed(2) + "</b></p>" +
        '<button class="cart-pay" type="button">Pay by card</button>' +
        '<p class="cart-note">Import duty or VAT charged in your country is not included.</p>' +
        '<p class="rev-note cart-msg"></p>' +
        "</div>";

      root.querySelectorAll("tr[data-ref]").forEach(function (tr) {
        var ref = tr.getAttribute("data-ref"), idx = tr.getAttribute("data-i");
        tr.querySelector(".c-qty").addEventListener("change", function (e) {
          BoyarnCart.setQty(ref, idx, parseInt(e.target.value, 10));
          renderCart(root);
        });
        tr.querySelector(".c-del").addEventListener("click", function () {
          BoyarnCart.remove(ref, idx);
          renderCart(root);
        });
      });

      root.querySelector(".cart-pay").addEventListener("click", function (e) {
        var btn = e.target, msg = root.querySelector(".cart-msg");
        btn.disabled = true;
        btn.textContent = "Opening Stripe...";
        fetch(BoyarnCart.API + "/api/cart-checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: items.map(function (it) {
              return { ref: it.ref, i: it.i, c: it.c, qty: parseInt(it.qty, 10) || 1 };
            })
          })
        })
          .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
          .then(function (res) {
            if (res.ok && res.d.url) {
              location.href = res.d.url;   // 购物车在 thanks.html 才清空，放弃支付可返回重试
              return;
            }
            btn.disabled = false;
            btn.textContent = "Pay by card";
            msg.textContent = res.d.error === "payments not configured"
              ? "Card payment is not switched on yet. Please message us on WhatsApp."
              : "Payment could not start: " + (res.d.error || "unknown error");
            msg.className = "rev-note cart-msg err";
          })
          .catch(function () {
            btn.disabled = false;
            btn.textContent = "Pay by card";
            msg.textContent = "Network error, please retry.";
          });
      });
    })
    .catch(function () {
      root.innerHTML = '<p class="cart-empty">Could not load prices. Please refresh.</p>';
    });
}

/* 付款成功：清空购物车 */
if (location.pathname.indexOf("thanks") > -1) {
  try { localStorage.removeItem("boyarn-cart"); } catch (e) {}
}
