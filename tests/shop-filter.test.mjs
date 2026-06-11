import { test } from "node:test";
import assert from "node:assert/strict";
import { boot } from "./helpers/dom.mjs";

const shopMarkup = `
  <div class="filter-pills">
    <button class="filter-pill active" data-filter="all">All</button>
    <button class="filter-pill" data-filter="leather">Leather</button>
    <button class="filter-pill" data-filter="puffer">Puffer</button>
  </div>
  <input type="search" id="shop-search" class="shop-search">
  <div class="row" id="shop-grid">
    <div data-cat="leather" data-name="Heritage Leather Jacket"></div>
    <div data-cat="puffer"  data-name="Nordic Puffer Coat"></div>
    <div data-cat="leather" data-name="Onyx Biker Jacket"></div>
    <div data-cat="denim"   data-name="Metro Denim Jacket"></div>
  </div>
  <p id="no-results" class="no-results"></p>
`;

const visibleCards = (document) =>
  [...document.querySelectorAll("#shop-grid [data-cat]")].filter(
    (c) => c.style.display !== "none"
  );

test("every product is visible before any filtering", () => {
  const { document } = boot(shopMarkup);
  assert.equal(visibleCards(document).length, 4);
  assert.equal(document.getElementById("no-results").style.display, "none");
});

test("clicking a category pill shows only that category", () => {
  const { document } = boot(shopMarkup);
  const leather = [...document.querySelectorAll(".filter-pill")].find(
    (p) => p.getAttribute("data-filter") === "leather"
  );
  leather.click();
  const shown = visibleCards(document);
  assert.equal(shown.length, 2);
  assert.ok(shown.every((c) => c.getAttribute("data-cat") === "leather"));
});

test("selecting a pill marks it active and clears the previous one", () => {
  const { document } = boot(shopMarkup);
  const pills = [...document.querySelectorAll(".filter-pill")];
  const puffer = pills.find((p) => p.getAttribute("data-filter") === "puffer");
  puffer.click();
  assert.equal(puffer.classList.contains("active"), true);
  assert.equal(pills.filter((p) => p.classList.contains("active")).length, 1);
});

test("the live search narrows results by product name", () => {
  const { window, document } = boot(shopMarkup);
  const search = document.getElementById("shop-search");
  search.value = "biker";
  search.dispatchEvent(new window.Event("input", { bubbles: true }));
  const shown = visibleCards(document);
  assert.equal(shown.length, 1);
  assert.equal(shown[0].getAttribute("data-name"), "Onyx Biker Jacket");
});

test("search is case-insensitive", () => {
  const { window, document } = boot(shopMarkup);
  const search = document.getElementById("shop-search");
  search.value = "NORDIC";
  search.dispatchEvent(new window.Event("input", { bubbles: true }));
  assert.equal(visibleCards(document).length, 1);
});

test("category and search combine (AND) together", () => {
  const { window, document } = boot(shopMarkup);
  const leather = [...document.querySelectorAll(".filter-pill")].find(
    (p) => p.getAttribute("data-filter") === "leather"
  );
  leather.click();
  const search = document.getElementById("shop-search");
  search.value = "heritage";
  search.dispatchEvent(new window.Event("input", { bubbles: true }));
  const shown = visibleCards(document);
  assert.equal(shown.length, 1);
  assert.equal(shown[0].getAttribute("data-name"), "Heritage Leather Jacket");
});

test("a query with no matches reveals the empty-state message", () => {
  const { window, document } = boot(shopMarkup);
  const search = document.getElementById("shop-search");
  search.value = "zzzznotathing";
  search.dispatchEvent(new window.Event("input", { bubbles: true }));
  assert.equal(visibleCards(document).length, 0);
  assert.equal(document.getElementById("no-results").style.display, "block");
});
