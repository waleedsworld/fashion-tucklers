import { test } from "node:test";
import assert from "node:assert/strict";
import { boot } from "./helpers/dom.mjs";

const navMarkup = `
  <div id="mySidenav" class="sidenav" style="width:0"></div>
  <div class="main_nav">
    <ul>
      <li><a href="index.html">Home</a></li>
      <li><a href="products.html">Products</a></li>
      <li><a href="contact.html">Contact</a></li>
    </ul>
  </div>
`;

test("openNav / closeNav toggle the slide-out panel width", () => {
  const { window, document } = boot(navMarkup);
  const panel = document.getElementById("mySidenav");
  window.openNav();
  assert.equal(panel.style.width, "100%");
  window.closeNav();
  assert.match(panel.style.width, /^0(px)?$/);
});

test("the current page's nav link is marked active", () => {
  const { document } = boot(navMarkup, { url: "https://tucklers.test/products.html" });
  const active = document.querySelector(".main_nav a.is-active");
  assert.ok(active, "expected one active link");
  assert.equal(active.getAttribute("href"), "products.html");
});

test("only the matching link is active, not the others", () => {
  const { document } = boot(navMarkup, { url: "https://tucklers.test/contact.html" });
  const activeLinks = document.querySelectorAll(".main_nav a.is-active");
  assert.equal(activeLinks.length, 1);
  assert.equal(activeLinks[0].getAttribute("href"), "contact.html");
});

test("a bare directory URL resolves to index.html as active", () => {
  const { document } = boot(navMarkup, { url: "https://tucklers.test/" });
  const active = document.querySelector(".main_nav a.is-active");
  assert.equal(active.getAttribute("href"), "index.html");
});
