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


  /* ---------------- 样品车：阿里巴巴式选色面板 ---------------- */
  var sb = document.querySelector("[data-sample]");
  if (sb) {
    var ref = sb.getAttribute("data-sample");
    fetch(API + "/api/config")
      .then(function (r) { return r.json(); })
      .then(function (cfg) {
        if (!cfg.payments) return;

        var feeNode = sb.querySelector(".sb-fee");
        var unitTxt = feeNode ? feeNode.textContent : "$0.00";
        var unit = Math.round(parseFloat(unitTxt.replace(/[^0-9.]/g, "")) * 100) || 0;

        // 从页面已有的实拍色卡按钮生成颜色行，索引与服务端 skus.js 一致
        var sw = [].slice.call(document.querySelectorAll(".swatches-photo .sw-btn"));
        var rows = sw.length
          ? sw
          : [{ getAttribute: function () { return ""; } }];   // 占位：无色卡

        var listHtml = rows.map(function (b, n) {
          var nm = sw.length ? (b.getAttribute("data-name") || ("Colour " + (n + 1))) : "As shown";
          var big = sw.length ? (b.getAttribute("data-large") || "") : "";
          var idx = sw.length ? n : -1;
          var img = big ? '<img src="' + big + '" alt="" width="44" height="44" loading="' + (n < 6 ? "eager" : "lazy") + '">'
                        : '<span class="sku-ph"></span>';
          return '<li class="sku-row" data-i="' + idx + '" data-name="' + nm.replace(/"/g, "") + '">' +
            img +
            '<span class="sku-nm">' + nm + "</span>" +
            '<span class="sku-pr">' + unitTxt + "</span>" +
            '<span class="sku-step">' +
            '<button type="button" class="q-m" aria-label="Less">\u2212</button>' +
            '<input class="q-i" type="number" min="0" max="5" value="0" inputmode="numeric" aria-label="Quantity">' +
            '<button type="button" class="q-p" aria-label="More">+</button>' +
            "</span></li>";
        }).join("");

        // 规格表移到主图所在左栏下方
        var specEl = document.querySelector(".spec");
        var galMain = document.querySelector(".gal-main");
        if (specEl && galMain) {
          var leftCol = galMain.parentNode;
          var thumbs = document.querySelector(".gal-thumbs");
          if (thumbs && thumbs.parentNode === leftCol) leftCol.insertBefore(specEl, thumbs.nextSibling);
          else leftCol.appendChild(specEl);
          specEl.classList.add("spec-under-gal");
        }

        // 原色卡区整体隐藏（颜色改到价格下方的列表里）
        var oldBlock = document.querySelector(".colours");
        if (oldBlock) oldBlock.style.display = "none";

        var panel = document.createElement("div");
        panel.className = "sku-panel";
        panel.innerHTML =
          '<p class="eyebrow">Select colour and quantity</p>' +
          '<ul class="sku-list">' + listHtml + "</ul>" +
          '<p class="colours-note">Photographed swatches from this style. Samples are charged at the ' +
          "top-tier price shown above. Freight is calculated at checkout by order size.</p>";
        // 放在价格块正下方（阿里巴巴的位置），而不是页面底部
        var priceEl = document.querySelector(".price");
        if (priceEl && priceEl.parentNode) {
          priceEl.parentNode.insertBefore(panel, priceEl.nextSibling);
        } else {
          sb.parentNode.insertBefore(panel, sb);
        }
        sb.style.display = "none";

        var bar = document.createElement("div");
        bar.className = "sku-bar";
        bar.innerHTML = '<span class="sku-sub-wrap">Subtotal <b class="sku-sub">' +
          "$0.00</b><span class=\"sku-qty-n\"></span></span>" +
          '<span class="sku-btns">' +
          '<a class="sku-gocart" href="' + BoyarnCart.base() + 'cart.html" hidden>Checkout <b class="sku-cn">0</b></a>' +
          '<button type="button" class="sku-add" disabled>Add to cart</button>' +
          '<button type="button" class="sku-buy" disabled>Buy now</button>' +
          "</span>";
        document.body.appendChild(bar);

        var subEl = bar.querySelector(".sku-sub");
        var qtyEl = bar.querySelector(".sku-qty-n");
        var addBtn = bar.querySelector(".sku-add");

        function recalc() {
          var qn = 0;
          [].slice.call(panel.querySelectorAll(".sku-i, .q-i")).forEach(function () {});
          [].slice.call(panel.querySelectorAll(".sku-row")).forEach(function (li) {
            var q = parseInt(li.querySelector(".q-i").value, 10) || 0;
            qn += Math.max(0, Math.min(5, q));
          });
          subEl.textContent = "$" + ((unit * qn) / 100).toFixed(2);
          qtyEl.textContent = qn ? " \u00b7 " + qn + " pc" + (qn > 1 ? "s" : "") : "";
          addBtn.disabled = qn === 0;
          var bb = bar.querySelector(".sku-buy");
          if (bb) bb.disabled = qn === 0;
        }

        // 点缩略图或颜色名 -> 主图切换成该颜色的大图
        function showMain(src) {
          if (!src) return;
          var vid = document.getElementById("galVid");
          var img = document.getElementById("galImg");
          if (vid) { try { vid.pause(); } catch (e) {} vid.hidden = true; }
          if (img) { img.hidden = false; img.src = src; }
          var main = document.querySelector(".gal-main");
          if (main) main.classList.add("show-img");
        }
        panel.querySelectorAll(".sku-row").forEach(function (li) {
          var big = sw.length ? rows[parseInt(li.getAttribute("data-i"), 10)].getAttribute("data-large") : "";
          [li.querySelector("img"), li.querySelector(".sku-nm")].forEach(function (t) {
            if (!t) return;
            t.style.cursor = "pointer";
            t.addEventListener("click", function () { showMain(big); });
          });
          var inp = li.querySelector(".q-i");
          li.querySelector(".q-p").addEventListener("click", function () {
            inp.value = Math.min(5, (parseInt(inp.value, 10) || 0) + 1);
            recalc();
          });
          li.querySelector(".q-m").addEventListener("click", function () {
            inp.value = Math.max(0, (parseInt(inp.value, 10) || 0) - 1);
            recalc();
          });
          inp.addEventListener("input", recalc);
        });

        function picked() {
          var out = [];
          panel.querySelectorAll(".sku-row").forEach(function (li) {
            var q = parseInt(li.querySelector(".q-i").value, 10) || 0;
            if (q <= 0) return;
            out.push({
              ref: ref,
              i: parseInt(li.getAttribute("data-i"), 10),
              c: li.getAttribute("data-name"),
              qty: Math.min(5, q)
            });
          });
          return out;
        }

        var buyBtn = bar.querySelector(".sku-buy");
        buyBtn.addEventListener("click", function () {
          var items = picked();
          if (!items.length) return;
          buyBtn.disabled = true;
          buyBtn.textContent = "Opening Stripe...";
          fetch(API + "/api/cart-checkout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ items: items })
          })
            .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
            .then(function (res) {
              if (res.ok && res.d.url) { location.href = res.d.url; return; }
              buyBtn.disabled = false;
              buyBtn.textContent = "Buy now";
              alert(res.d.error === "payments not configured"
                ? "Card payment is not switched on yet. Please message us on WhatsApp."
                : "Payment could not start: " + (res.d.error || "unknown error"));
            })
            .catch(function () {
              buyBtn.disabled = false;
              buyBtn.textContent = "Buy now";
              alert("Network error, please retry.");
            });
        });

        addBtn.addEventListener("click", function () {
          var added = 0;
          picked().forEach(function (it) {
            BoyarnCart.add(it);
            added += it.qty;
          });
          if (added) {
            var label = addBtn.textContent;
            addBtn.textContent = "Added " + added + " \u2713";
            setTimeout(function () { addBtn.textContent = label || "Add to cart"; }, 1400);
          }
        });

        recalc();
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

  // 与 Worker 一致：首重 100g / 18 美元，续重每 100g / 2.5 美元
  function shipCents(grams) {
    if (grams <= 0) return 0;
    var steps = Math.ceil(Math.max(0, grams - 100) / 100);
    return 1800 + steps * 250;
  }

  function basePath() {
    var p = location.pathname;
    if (p.indexOf("/product/") > -1) return "../";
    return "";
  }

  /* 浮动入口 */
  function paint() {
    if (document.getElementById("cart-root")) {   // 购物车页本身已有明细，不显示浮标
      var old = document.getElementById("cartPill");
      if (old) old.style.display = "none";
      return;
    }
    var n = count();
    var go = document.querySelector(".sku-gocart");
    if (go) {
      if (n > 0) { go.hidden = false; go.querySelector(".sku-cn").textContent = n; }
      else { go.hidden = true; }
    }
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
  fetch(BoyarnCart.base() + "assets/items.json")
    .then(function (r) { return r.json(); })
    .then(function (px) {
      var subtotal = 0, totalQty = 0, totalG = 0;
      var rows = items.map(function (it) {
        var meta = px[it.ref] || { p: 0, g: 60 };
        var unit = meta.p || 0;
        var q = parseInt(it.qty, 10) || 1;
        subtotal += unit * q; totalQty += q; totalG += (meta.g || 60) * q;
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

      var ship = BoyarnCart.shipCents(totalG);
      var grand = subtotal + ship;
      root.innerHTML =
        '<table class="cart-table"><thead><tr><th>Style</th><th>Colour</th><th>Qty</th>' +
        "<th>Unit</th><th>Subtotal</th><th></th></tr></thead><tbody>" + rows + "</tbody></table>" +
        '<div class="cart-sum">' +
        "<p>Items <b>" + totalQty + "</b> pcs</p>" +
        "<p>Samples <b>$" + (subtotal / 100).toFixed(2) + "</b></p>" +
        "<p>Courier freight <b>$" + (ship / 100).toFixed(2) + "</b> " +
        '<span class="cart-note">(by order size)</span></p>' +
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
