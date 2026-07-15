/* =====================================================================
   ab-testing.js  —  Tucklers lightweight A/B testing harness
   Vanilla JS, zero dependencies. Provides:
     • sticky, deterministic variant assignment (weighted split)
     • a persistent visitor id
     • a declarative DOM binding layer (data-ab-* attributes)
     • an event/goal hook that buffers locally and can beacon out
     • a small public API on window.abTest for scripted experiments

   Nothing here phones home unless you call abTest.configure({endpoint}).
   Assignments and buffered events live in localStorage so a returning
   visitor always sees the same variant.
   ===================================================================== */
(function () {
  "use strict";

  var VISITOR_KEY = "tucklers_ab_visitor";
  var ASSIGN_KEY = "tucklers_ab_assignments";
  var EVENT_KEY = "tucklers_ab_events";
  var EVENT_CAP = 200; // keep the local buffer bounded

  var config = { endpoint: null, debug: false };
  var registry = {};      // experiment name -> { variants:[{id,weight}] }
  var listeners = [];     // event subscribers

  /* ---- storage helpers (fail-safe if storage is unavailable) ------- */
  function readJSON(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) { return fallback; }
  }
  function writeJSON(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {}
  }

  /* ---- visitor id -------------------------------------------------- */
  function uid() {
    // RFC4122-ish v4, adequate for bucketing (not security sensitive)
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
      var r = (Math.random() * 16) | 0;
      var v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
  function visitorId() {
    var id;
    try { id = localStorage.getItem(VISITOR_KEY); } catch (e) {}
    if (!id) {
      id = uid();
      try { localStorage.setItem(VISITOR_KEY, id); } catch (e) {}
    }
    return id;
  }

  /* ---- deterministic hash (FNV-1a, 32-bit) ------------------------- */
  function hash(str) {
    var h = 0x811c9dc5;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
    }
    return h >>> 0;
  }

  /* ---- variant assignment ------------------------------------------ */
  function normaliseVariants(variants) {
    // Accept ["a","b"] or [{id:"a",weight:2}, ...]
    return variants.map(function (v) {
      if (typeof v === "string") return { id: v, weight: 1 };
      return { id: String(v.id), weight: v.weight > 0 ? v.weight : 1 };
    });
  }

  function pick(name, variants) {
    var norm = normaliseVariants(variants);
    var total = norm.reduce(function (s, v) { return s + v.weight; }, 0);
    // deterministic point in [0, total) derived from visitor + experiment
    var frac = (hash(visitorId() + ":" + name) % 100000) / 100000;
    var target = frac * total;
    var acc = 0;
    for (var i = 0; i < norm.length; i++) {
      acc += norm[i].weight;
      if (target < acc) return norm[i].id;
    }
    return norm[norm.length - 1].id;
  }

  function assignmentsMap() { return readJSON(ASSIGN_KEY, {}); }

  function define(name, variants, opts) {
    opts = opts || {};
    registry[name] = { variants: normaliseVariants(variants) };
    // resolve straight away so the assignment is stable and inspectable
    variant(name);
    return registry[name];
  }

  function variant(name) {
    var store = assignmentsMap();
    if (store[name]) return store[name];
    var def = registry[name];
    if (!def) return null; // unknown experiment -> control (null)
    var chosen = pick(name, def.variants);
    store[name] = chosen;
    writeJSON(ASSIGN_KEY, store);
    track("$exposure", { experiment: name, variant: chosen });
    return chosen;
  }

  /* ---- event hook -------------------------------------------------- */
  function track(event, props) {
    var payload = {
      event: String(event),
      props: props || {},
      ts: Date.now(),
      visitor: visitorId(),
      path: location.pathname,
      assignments: assignmentsMap()
    };

    // buffer locally (bounded)
    var buf = readJSON(EVENT_KEY, []);
    buf.push(payload);
    if (buf.length > EVENT_CAP) buf = buf.slice(buf.length - EVENT_CAP);
    writeJSON(EVENT_KEY, buf);

    // notify in-page subscribers + a DOM event for anyone listening
    listeners.forEach(function (fn) { try { fn(payload); } catch (e) {} });
    try {
      document.dispatchEvent(new CustomEvent("ab:event", { detail: payload }));
    } catch (e) {}

    // optional off-site delivery (only if explicitly configured)
    if (config.endpoint && navigator.sendBeacon) {
      try {
        navigator.sendBeacon(config.endpoint, JSON.stringify(payload));
      } catch (e) {}
    }
    if (config.debug && window.console) {
      console.log("[ab]", payload.event, payload.props);
    }
    return payload;
  }

  /* ---- declarative DOM binding ------------------------------------- */
  // <a data-ab-experiment="hero_cta"
  //    data-ab-text-a="Shop Jackets" data-ab-text-b="Shop the Collection"
  //    data-ab-class-b="btn-emphasis"
  //    data-ab-href-b="https://…">…</a>
  function applyBindings(root) {
    (root || document).querySelectorAll("[data-ab-experiment]").forEach(function (el) {
      var name = el.getAttribute("data-ab-experiment");
      if (!name) return;

      // auto-register from data-ab-variants="a,b,c" if not defined in code
      if (!registry[name]) {
        var declared = el.getAttribute("data-ab-variants");
        var list = declared
          ? declared.split(",").map(function (s) { return s.trim(); }).filter(Boolean)
          : discoverVariants(el);
        if (list.length) define(name, list);
      }

      var v = variant(name);
      if (!v) return;
      el.setAttribute("data-ab-variant", v);

      var txt = el.getAttribute("data-ab-text-" + v);
      if (txt !== null && txt !== undefined) el.textContent = txt;

      var href = el.getAttribute("data-ab-href-" + v);
      if (href) el.setAttribute("href", href);

      var cls = el.getAttribute("data-ab-class-" + v);
      if (cls) el.className = (el.className ? el.className + " " : "") + cls;

      var hide = el.getAttribute("data-ab-hide-" + v);
      if (hide === "true") el.style.display = "none";
    });

    // goal hooks: fire a tracked event on click
    (root || document).querySelectorAll("[data-ab-goal]").forEach(function (el) {
      if (el.getAttribute("data-ab-goal-bound") === "1") return;
      el.setAttribute("data-ab-goal-bound", "1");
      el.addEventListener("click", function () {
        track(el.getAttribute("data-ab-goal"), {
          experiment: el.getAttribute("data-ab-experiment") || null,
          variant: el.getAttribute("data-ab-variant") || null,
          label: el.getAttribute("data-ab-label") || (el.textContent || "").trim()
        });
      });
    });
  }

  // Infer the set of variant ids from data-ab-text-*/href-*/class-* attrs
  function discoverVariants(el) {
    var found = {};
    Array.prototype.forEach.call(el.attributes, function (attr) {
      var m = attr.name.match(/^data-ab-(?:text|href|class|hide)-(.+)$/);
      if (m) found[m[1]] = true;
    });
    return Object.keys(found);
  }

  /* ---- public API -------------------------------------------------- */
  window.abTest = {
    configure: function (o) { if (o) { config.endpoint = o.endpoint || config.endpoint; if ("debug" in o) config.debug = !!o.debug; } },
    define: define,
    variant: variant,
    isVariant: function (name, id) { return variant(name) === id; },
    track: track,
    on: function (fn) { if (typeof fn === "function") listeners.push(fn); },
    getAssignments: function () { return assignmentsMap(); },
    getEvents: function () { return readJSON(EVENT_KEY, []); },
    flush: function () { writeJSON(EVENT_KEY, []); },
    reset: function () {
      try {
        localStorage.removeItem(ASSIGN_KEY);
        localStorage.removeItem(EVENT_KEY);
      } catch (e) {}
      registry = {};
    },
    visitor: visitorId,
    apply: applyBindings
  };

  document.addEventListener("DOMContentLoaded", function () {
    applyBindings(document);
  });
})();
