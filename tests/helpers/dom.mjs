/* Shared test helpers: boot a jsdom window with the site's behaviour
   script (js/tucklers.js) executed against a fragment of markup, or
   parse one of the real HTML pages as a static document. */
import { JSDOM } from "jsdom";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
export const ROOT = join(here, "..", "..");

const behaviourSrc = readFileSync(join(ROOT, "js", "tucklers.js"), "utf8");

/* Build a live DOM, inject tucklers.js and fire DOMContentLoaded so the
   IIFE wires everything up — exactly as a real page load would. */
export function boot(bodyHTML, { url = "https://tucklers.test/index.html" } = {}) {
  const dom = new JSDOM(
    `<!doctype html><html><head></head><body>${bodyHTML}</body></html>`,
    { url, runScripts: "dangerously", pretendToBeVisual: true }
  );
  const { window } = dom;
  // jsdom does not implement scrolling; stub what the script touches.
  window.scrollTo = () => {};
  const script = window.document.createElement("script");
  script.textContent = behaviourSrc;
  window.document.body.appendChild(script);
  window.document.dispatchEvent(
    new window.Event("DOMContentLoaded", { bubbles: true, cancelable: false })
  );
  return { dom, window, document: window.document };
}

/* Dispatch a bubbling event of the given type on a node. */
export function fire(window, node, type) {
  node.dispatchEvent(new window.Event(type, { bubbles: true, cancelable: true }));
}

/* Read one of the shipped HTML pages as a static (script-free) document. */
export function loadPage(name) {
  const html = readFileSync(join(ROOT, name), "utf8");
  return { html, dom: new JSDOM(html) };
}
