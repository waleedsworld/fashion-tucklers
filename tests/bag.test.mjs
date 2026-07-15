import { test } from "node:test";
import assert from "node:assert/strict";
import { boot } from "./helpers/dom.mjs";

const bagMarkup = `
  <span id="cart-badge" class="cart-badge">0</span>
  <div id="toast" role="status"></div>
  <button class="add-bag" data-name="Aurora Bomber Jacket" type="button">Add to Bag</button>
  <button class="add-bag" data-name="Nordic Puffer Coat" type="button">Add to Bag</button>
`;

test("badge starts empty when localStorage has no saved bag", () => {
  const { document } = boot(bagMarkup);
  const badge = document.getElementById("cart-badge");
  assert.equal(badge.textContent, "0");
  assert.equal(badge.classList.contains("show"), false);
});

test("clicking Add to Bag increments the badge and shows it", () => {
  const { document } = boot(bagMarkup);
  const badge = document.getElementById("cart-badge");
  document.querySelectorAll(".add-bag")[0].click();
  assert.equal(badge.textContent, "1");
  assert.equal(badge.classList.contains("show"), true);
});

test("multiple clicks accumulate the count", () => {
  const { document } = boot(bagMarkup);
  const buttons = document.querySelectorAll(".add-bag");
  buttons[0].click();
  buttons[1].click();
  buttons[0].click();
  assert.equal(document.getElementById("cart-badge").textContent, "3");
});

test("the count is written to localStorage under tucklers_bag", () => {
  const { window, document } = boot(bagMarkup);
  document.querySelectorAll(".add-bag")[0].click();
  assert.equal(window.localStorage.getItem("tucklers_bag"), "1");
});

test("a previously saved bag count is restored when the page initialises", () => {
  const { window, document } = boot(bagMarkup);
  // Simulate an earlier visit having saved a count, then re-run init.
  window.localStorage.setItem("tucklers_bag", "5");
  document.dispatchEvent(new window.Event("DOMContentLoaded", { bubbles: true }));
  const badge = document.getElementById("cart-badge");
  assert.equal(badge.textContent, "5");
  assert.equal(badge.classList.contains("show"), true);
});

test("adding to bag confirms with an Added label and a toast", () => {
  const { document } = boot(bagMarkup);
  const btn = document.querySelectorAll(".add-bag")[0];
  btn.click();
  assert.match(btn.textContent, /Added/);
  assert.match(document.getElementById("toast").textContent, /Aurora Bomber Jacket/);
});
