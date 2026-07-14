/* =====================================================================
   tucklers.js  —  Tucklers Soft Layers front-end behaviour
   Vanilla JS, no jQuery, no third-party trackers. Handles:
   mobile nav, a localStorage shopping bag counter, product
   filter + live search, newsletter capture, contact-form validation,
   back-to-top and toast notifications.
   ===================================================================== */
(function () {
  "use strict";

  var STORE_KEY = "tucklers_bag";

  /* ----------------------------------------------------------------- */
  /* Mobile side navigation                                            */
  /* ----------------------------------------------------------------- */
  window.openNav = function () {
    var el = document.getElementById("mySidenav");
    if (el) el.style.width = "100%";
  };
  window.closeNav = function () {
    var el = document.getElementById("mySidenav");
    if (el) el.style.width = "0";
  };

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
  /* Product filter + live search                                      */
  /* ----------------------------------------------------------------- */
  function wireShop() {
    var grid = document.getElementById("shop-grid");
    if (!grid) return;

    var pills = document.querySelectorAll(".filter-pill");
    var search = document.getElementById("shop-search");
    var empty = document.getElementById("no-results");
    var activeCat = "all";

    function apply() {
      var q = (search && search.value ? search.value : "").trim().toLowerCase();
      var shown = 0;
      grid.querySelectorAll("[data-cat]").forEach(function (col) {
        var cat = col.getAttribute("data-cat");
        var name = (col.getAttribute("data-name") || "").toLowerCase();
        var matchCat = activeCat === "all" || cat === activeCat;
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
    wireShop();
    wireNewsletter();
    wireContactForm();
    wireBackToTop();
    wireActiveNav();
  });
})();
