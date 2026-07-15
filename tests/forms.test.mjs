import { test } from "node:test";
import assert from "node:assert/strict";
import { boot } from "./helpers/dom.mjs";

const newsletterMarkup = `
  <form id="newsletter-form" class="newsletter-form">
    <input type="email" name="email" value="">
    <button type="submit">Join</button>
  </form>
  <p id="newsletter-note" class="newsletter-note"></p>
`;

const contactMarkup = `
  <form id="contact-form" class="tuck-form" novalidate>
    <input type="text"  id="cf-first" data-required value="">
    <input type="email" id="cf-email" data-required value="">
    <textarea id="cf-message" data-required></textarea>
    <button type="submit">Send</button>
  </form>
  <p id="form-status" class="form-status"></p>
`;

function submit(window, form) {
  form.dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));
}

test("newsletter rejects a malformed email address", () => {
  const { window, document } = boot(newsletterMarkup);
  const form = document.getElementById("newsletter-form");
  form.querySelector("input[type=email]").value = "not-an-email";
  submit(window, form);
  assert.match(document.getElementById("newsletter-note").textContent, /again/i);
  assert.equal(window.localStorage.getItem("tucklers_subscriber"), null);
});

test("newsletter accepts a valid email, saves it and confirms", () => {
  const { window, document } = boot(newsletterMarkup);
  const form = document.getElementById("newsletter-form");
  const input = form.querySelector("input[type=email]");
  input.value = "ada@example.com";
  submit(window, form);
  assert.match(document.getElementById("newsletter-note").textContent, /on the list/i);
  assert.equal(window.localStorage.getItem("tucklers_subscriber"), "ada@example.com");
  assert.equal(input.value, ""); // form was reset
});

test("contact form blocks submission when required fields are empty", () => {
  const { window, document } = boot(contactMarkup);
  submit(window, document.getElementById("contact-form"));
  const status = document.getElementById("form-status");
  assert.match(status.textContent, /highlighted/i);
  assert.equal(status.className.includes("ok"), false);
  assert.equal(document.getElementById("cf-first").classList.contains("invalid"), true);
});

test("contact form flags a bad email even when text fields are filled", () => {
  const { window, document } = boot(contactMarkup);
  document.getElementById("cf-first").value = "Ada";
  document.getElementById("cf-email").value = "ada@nope";
  document.getElementById("cf-message").value = "Hello";
  submit(window, document.getElementById("contact-form"));
  assert.equal(document.getElementById("cf-email").classList.contains("invalid"), true);
  assert.match(document.getElementById("form-status").textContent, /highlighted/i);
});

test("contact form accepts a complete, valid submission", () => {
  const { window, document } = boot(contactMarkup);
  document.getElementById("cf-first").value = "Ada";
  document.getElementById("cf-email").value = "ada@example.com";
  document.getElementById("cf-message").value = "Love the jackets!";
  submit(window, document.getElementById("contact-form"));
  const status = document.getElementById("form-status");
  assert.match(status.textContent, /stitched and sent/i);
  assert.equal(status.className.includes("ok"), true);
  assert.equal(document.getElementById("cf-first").value, ""); // reset
});

test("blur validation marks an empty required field invalid", () => {
  const { window, document } = boot(contactMarkup);
  const field = document.getElementById("cf-first");
  field.dispatchEvent(new window.Event("blur", { bubbles: false }));
  assert.equal(field.classList.contains("invalid"), true);
});
