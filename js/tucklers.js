/* =====================================================================
   tucklers.js  —  Tucklers Soft Layers front-end behaviour
   Vanilla JS, no jQuery, no third-party trackers. Handles:
   mobile nav, a localStorage shopping bag counter, a persistent
   wishlist (save-for-later), product filter + live search + sort,
   newsletter capture, contact-form validation, back-to-top and
   toast notifications.
   ===================================================================== */
(function () {
  "use strict";

  var STORE_KEY = "tucklers_bag";
  var WISH_KEY = "tucklers_wishlist";

  /* Set by wireShop(); lets the wishlist re-run the shop filter live
     when an item is un-saved while the "Saved" view is active. */
  var refreshShop = null;

  /* ----------------------------------------------------------------- */
  /* Mobile side navigation                                            */
  /* ----------------------------------------------------------------- */
  function navToggleBtn() { return document.querySelector(".toggle_icon"); }

  window.openNav = function () {
    var el = document.getElementById("mySidenav");
    if (!el) return;
    el.style.width = "100%";
    el.setAttribute("aria-hidden", "false");
    var t = navToggleBtn();
    if (t) t.setAttribute("aria-expanded", "true");
    /* Move focus into the panel for keyboard users. */
    var close = el.querySelector(".closebtn");
    if (close) close.focus();
  };
  window.closeNav = function () {
    var el = document.getElementById("mySidenav");
    if (!el) return;
    el.style.width = "0";
    el.setAttribute("aria-hidden", "true");
    var t = navToggleBtn();
    if (t) { t.setAttribute("aria-expanded", "false"); t.focus(); }
  };

  function wireNavKeyboard() {
    var t = navToggleBtn();
    if (t) {
      t.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
          e.preventDefault();
          window.openNav();
        }
      });
    }
    /* Escape closes the slide-out from anywhere. */
    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape" && e.key !== "Esc") return;
      var el = document.getElementById("mySidenav");
      if (el && parseInt(el.style.width, 10) > 0) window.closeNav();
    });
  }

  /* ----------------------------------------------------------------- */
  /* Toast helper                                                      */
  /* ----------------------------------------------------------------- */
  var toastTimer;
  function toast(msg) {
    var t = document.getElementById("toast");
    if (!t) return;
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove("show"); }, 2200);
  }

  /* ----------------------------------------------------------------- */
  /* Shopping bag (localStorage) — count persists across pages         */
  /* ----------------------------------------------------------------- */
  function getBagCount() {
    var n = parseInt(localStorage.getItem(STORE_KEY), 10);
    return isNaN(n) ? 0 : n;
  }
  function setBagCount(n) {
    localStorage.setItem(STORE_KEY, String(n));
    renderBadge();
  }
  function renderBadge() {
    var badge = document.getElementById("cart-badge");
    if (!badge) return;
    var n = getBagCount();
    badge.textContent = n;
    badge.classList.toggle("show", n > 0);
  }

  function wireAddToBag() {
    document.querySelectorAll(".add-bag").forEach(function (btn) {
      btn.addEventListener("click", function () {
        setBagCount(getBagCount() + 1);
        var name = btn.getAttribute("data-name") || "Item";
        toast("Added “" + name + "” to your bag");
        btn.classList.add("added");
        var original = btn.textContent;
        btn.textContent = "Added ✓";
        setTimeout(function () {
          btn.classList.remove("added");
          btn.textContent = original;
        }, 1200);
      });
    });
  }

  /* ----------------------------------------------------------------- */
  /* Wishlist / save-for-later (localStorage)                          */
  /* A heart toggle is injected onto every product card. Saved items   */
  /* persist across pages and power the "Saved" filter on the shop.    */
  /* ----------------------------------------------------------------- */
  function getWishlist() {
    try {
      var raw = JSON.parse(localStorage.getItem(WISH_KEY));
      return Array.isArray(raw) ? raw : [];
    } catch (err) { return []; }
  }
  function isWished(name) {
    return getWishlist().indexOf(name) !== -1;
  }
  function toggleWish(name) {
    var list = getWishlist();
    var i = list.indexOf(name);
    var nowSaved = i === -1;
    if (nowSaved) { list.push(name); } else { list.splice(i, 1); }
    try { localStorage.setItem(WISH_KEY, JSON.stringify(list)); } catch (err) {}
    return nowSaved;
  }

  /* Resolve a stable product name for a given card. */
  function cardName(box) {
    var host = box.closest("[data-name]");
    if (host && host.getAttribute("data-name")) return host.getAttribute("data-name");
    var addBtn = box.querySelector(".add-bag[data-name]");
    if (addBtn) return addBtn.getAttribute("data-name");
    var h = box.querySelector("h4");
    return h ? h.textContent.trim() : "";
  }

  function wireWishlist() {
    document.querySelectorAll(".product_box").forEach(function (box) {
      var media = box.querySelector(".product-media");
      if (!media || box.querySelector(".wish-btn")) return;
      var name = cardName(box);
      if (!name) return;

      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "wish-btn";
      btn.setAttribute("aria-label", "Save " + name + " to wishlist");
      btn.setAttribute("aria-pressed", isWished(name) ? "true" : "false");
      btn.innerHTML = "♥"; /* ♥ */
      if (isWished(name)) btn.classList.add("saved");

      btn.addEventListener("click", function (e) {
        e.preventDefault();
        var saved = toggleWish(name);
        btn.classList.toggle("saved", saved);
        btn.setAttribute("aria-pressed", saved ? "true" : "false");
        toast(saved ? "Saved “" + name + "” to your wishlist"
                    : "Removed “" + name + "” from your wishlist");
        /* If the shop is currently showing only saved items, refresh it. */
        if (refreshShop) refreshShop();
      });

      media.appendChild(btn);
    });
  }

  /* ----------------------------------------------------------------- */
  /* Product filter + live search + sort                               */
  /* ----------------------------------------------------------------- */
  function wireShop() {
    var grid = document.getElementById("shop-grid");
    if (!grid) return;

    var pills = document.querySelectorAll(".filter-pill");
    var search = document.getElementById("shop-search");
    var sort = document.getElementById("shop-sort");
    var empty = document.getElementById("no-results");
    var activeCat = "all";

    /* Remember the original DOM order so "Featured" can be restored. */
    var original = Array.prototype.slice.call(grid.querySelectorAll("[data-cat]"));

    function priceOf(col) {
      var el = col.querySelector(".price_text");
      var n = el ? parseFloat(el.textContent.replace(/[^0-9.]/g, "")) : NaN;
      return isNaN(n) ? 0 : n;
    }

    function order() {
      var mode = sort ? sort.value : "featured";
      var items = original.slice();
      if (mode === "price-asc") {
        items.sort(function (a, b) { return priceOf(a) - priceOf(b); });
      } else if (mode === "price-desc") {
        items.sort(function (a, b) { return priceOf(b) - priceOf(a); });
      } else if (mode === "name-asc") {
        items.sort(function (a, b) {
          return (a.getAttribute("data-name") || "").localeCompare(b.getAttribute("data-name") || "");
        });
      }
      /* Re-append in the chosen order (a no-op move for "featured"). */
      items.forEach(function (col) { grid.appendChild(col); });
    }

    function apply() {
      order();
      var q = (search && search.value ? search.value : "").trim().toLowerCase();
      var shown = 0;
      grid.querySelectorAll("[data-cat]").forEach(function (col) {
        var cat = col.getAttribute("data-cat");
        var name = (col.getAttribute("data-name") || "").toLowerCase();
        var matchCat = activeCat === "all"
          || (activeCat === "saved" ? isWished(col.getAttribute("data-name") || "") : cat === activeCat);
        var matchText = !q || name.indexOf(q) !== -1;
        var vis = matchCat && matchText;
        col.style.display = vis ? "" : "none";
        if (vis) shown++;
      });
      if (empty) empty.style.display = shown === 0 ? "block" : "none";
    }

    pills.forEach(function (p) {
      p.addEventListener("click", function () {
        pills.forEach(function (x) { x.classList.remove("active"); });
        p.classList.add("active");
        activeCat = p.getAttribute("data-filter");
        apply();
      });
    });
    if (search) search.addEventListener("input", apply);
    if (sort) sort.addEventListener("change", apply);

    refreshShop = apply; /* expose so the wishlist can refresh the view */
    apply();
  }

  /* ----------------------------------------------------------------- */
  /* Newsletter capture                                                */
  /* ----------------------------------------------------------------- */
  function wireNewsletter() {
    var form = document.getElementById("newsletter-form");
    if (!form) return;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var input = form.querySelector("input[type=email]");
      var note = document.getElementById("newsletter-note");
      var val = input.value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
        if (note) note.textContent = "Hmm, that email looks a little unravelled. Try again?";
        return;
      }
      try { localStorage.setItem("tucklers_subscriber", val); } catch (err) {}
      if (note) note.textContent = "You're on the list — warm layers incoming. ❤";
      form.reset();
    });
  }

  /* ----------------------------------------------------------------- */
  /* Contact form validation (no external validator lib)               */
  /* ----------------------------------------------------------------- */
  function wireContactForm() {
    var form = document.getElementById("contact-form");
    if (!form) return;

    function validateField(field) {
      var ok = true;
      var val = field.value.trim();
      if (field.type === "email") {
        ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
      } else {
        ok = val.length > 0;
      }
      field.classList.toggle("invalid", !ok);
      return ok;
    }

    form.querySelectorAll("[data-required]").forEach(function (f) {
      f.addEventListener("blur", function () { validateField(f); });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var allOk = true;
      form.querySelectorAll("[data-required]").forEach(function (f) {
        if (!validateField(f)) allOk = false;
      });
      var status = document.getElementById("form-status");
      if (!allOk) {
        if (status) { status.textContent = "Please fill in the highlighted fields."; status.className = "form-status"; }
        return;
      }
      if (status) { status.textContent = "Thanks! Your message is stitched and sent — we'll reply within a day."; status.className = "form-status ok"; }
      form.reset();
    });
  }

  /* ----------------------------------------------------------------- */
  /* Back to top                                                       */
  /* ----------------------------------------------------------------- */
  function wireBackToTop() {
    var btn = document.getElementById("back-to-top");
    if (!btn) return;
    window.addEventListener("scroll", function () {
      btn.classList.toggle("show", window.scrollY > 300);
    });
    btn.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  /* ----------------------------------------------------------------- */
  /* Active nav highlight                                              */
  /* ----------------------------------------------------------------- */
  function wireActiveNav() {
    var here = (location.pathname.split("/").pop() || "index.html").toLowerCase();
    if (here === "") here = "index.html";
    document.querySelectorAll(".main_nav a").forEach(function (a) {
      var href = (a.getAttribute("href") || "").toLowerCase();
      if (href === here) a.classList.add("is-active");
    });
  }

  /* ----------------------------------------------------------------- */
  document.addEventListener("DOMContentLoaded", function () {
    renderBadge();
    wireAddToBag();
    wireWishlist();
    wireShop();
    wireNewsletter();
    wireContactForm();
    wireBackToTop();
    wireActiveNav();
    wireNavKeyboard();
  });
})();
