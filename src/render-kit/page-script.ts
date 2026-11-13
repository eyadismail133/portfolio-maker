/**
 * The only script a portfolio page runs. It is written by us, never by users, and every part is
 * an extra: without it the page still shows everything and the contact form still sends.
 *
 * - Contact form: sends without leaving the page and shows the result.
 * - Gallery: opens images large, with arrow keys and Escape.
 * - Numbers in the stats section count up once, when they come into view.
 * - Scroll animation: sections fade and slide in smoothly as they come into view.
 * - Before and after (slider layout): the two images stack with a handle to drag. Without the
 *   script they are shown side by side.
 * - Pages set to "both" light and dark get a switch in the navbar. Without the script the page
 *   follows the visitor's system setting.
 *
 * Kept as a plain string so the exported HTML can ship it as script.js unchanged.
 */
export const PAGE_SCRIPT = String.raw`(function () {
  "use strict";
  var root = document.querySelector(".pk-root");
  if (!root) return;
  root.classList.add("pk-js");
  var calm = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var animation = root.getAttribute("data-pk-animation") || "subtle";
  var closeLabel = root.getAttribute("lang") === "ar" ? "إغلاق" : "Close";

  function onView(elements, run) {
    if (!("IntersectionObserver" in window)) {
      elements.forEach(run);
      return;
    }
    var seen = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          seen.unobserve(entry.target);
          run(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -10% 0px" });
    elements.forEach(function (el) { seen.observe(el); });
  }

  // Contact form
  Array.prototype.forEach.call(root.querySelectorAll("form[data-pk-contact]"), function (form) {
    var status = form.querySelector(".pk-form__status");
    var button = form.querySelector("button[type=submit]");
    form.addEventListener("submit", function (event) {
      if (!window.fetch || !window.FormData) return;
      event.preventDefault();
      var say = function (key, state) {
        if (!status) return;
        status.textContent = status.getAttribute("data-pk-" + key) || "";
        if (state) status.setAttribute("data-pk-state", state); else status.removeAttribute("data-pk-state");
      };
      say("sending");
      if (button) button.disabled = true;
      fetch(form.action, { method: "POST", body: new FormData(form), headers: { Accept: "application/json" } })
        .then(function (response) { return response.ok ? response.json() : Promise.reject(); })
        .then(function (result) {
          if (!result || !result.ok) return Promise.reject();
          form.reset();
          say("sent");
        })
        .catch(function () { say("failed", "error"); })
        .then(function () { if (button) button.disabled = false; });
    });
  });

  // Gallery: open images large
  var images = Array.prototype.slice.call(root.querySelectorAll(".pk-gallery img"));
  if (images.length && window.HTMLDialogElement) {
    var dialog = document.createElement("dialog");
    dialog.className = "pk-lightbox";
    dialog.innerHTML = '<figure><img alt=""><figcaption></figcaption></figure><button type="button" class="pk-lightbox__close"></button>';
    var big = dialog.querySelector("img");
    var caption = dialog.querySelector("figcaption");
    var close = dialog.querySelector("button");
    close.textContent = closeLabel;
    root.appendChild(dialog);
    var current = 0;
    var show = function (index) {
      current = (index + images.length) % images.length;
      var source = images[current];
      big.src = source.currentSrc || source.src;
      big.alt = source.alt;
      var text = source.closest("figure") && source.closest("figure").querySelector("figcaption");
      caption.textContent = text ? text.textContent : "";
      if (!dialog.open) dialog.showModal();
    };
    images.forEach(function (img, index) {
      img.setAttribute("tabindex", "0");
      img.setAttribute("role", "button");
      img.style.cursor = "zoom-in";
      img.addEventListener("click", function () { show(index); });
      img.addEventListener("keydown", function (event) {
        if (event.key === "Enter" || event.key === " ") { event.preventDefault(); show(index); }
      });
    });
    close.addEventListener("click", function () { dialog.close(); });
    dialog.addEventListener("click", function (event) { if (event.target === dialog) dialog.close(); });
    dialog.addEventListener("keydown", function (event) {
      var forward = root.getAttribute("dir") === "rtl" ? "ArrowLeft" : "ArrowRight";
      var back = forward === "ArrowLeft" ? "ArrowRight" : "ArrowLeft";
      if (event.key === forward) show(current + 1);
      if (event.key === back) show(current - 1);
    });
    dialog.addEventListener("close", function () { if (images[current]) images[current].focus(); });
  }

  // Stats: count up once
  if (!calm && animation !== "none") {
    var numbers = Array.prototype.filter.call(root.querySelectorAll(".pk-stats dd"), function (el) {
      return /^\D{0,3}\d[\d,]*(\.\d+)?/.test(el.textContent.trim());
    });
    onView(numbers, function (el) {
      var text = el.textContent.trim();
      var match = text.match(/^(\D{0,3})(\d[\d,]*(?:\.\d+)?)([\s\S]*)$/);
      if (!match) return;
      var target = parseFloat(match[2].replace(/,/g, ""));
      var decimals = (match[2].split(".")[1] || "").length;
      var commas = match[2].indexOf(",") !== -1;
      var start = null;
      var format = function (value) {
        var fixed = value.toFixed(decimals);
        if (commas) fixed = fixed.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        return match[1] + fixed + match[3];
      };
      var step = function (time) {
        if (start === null) start = time;
        var t = Math.min(1, (time - start) / 1200);
        el.textContent = format(target * (1 - Math.pow(1 - t, 3)));
        if (t < 1) requestAnimationFrame(step); else el.textContent = text;
      };
      el.textContent = format(0);
      requestAnimationFrame(step);
    });
  }

  // Before and after: one image with a handle
  Array.prototype.forEach.call(root.querySelectorAll("[data-pk-compare]"), function (box) {
    var range = document.createElement("input");
    range.type = "range";
    range.min = "0";
    range.max = "100";
    range.value = "50";
    range.className = "pk-before-after__range";
    range.setAttribute("aria-label", box.getAttribute("data-pk-compare-label") || "Compare");
    var knob = document.createElement("span");
    knob.className = "pk-before-after__knob";
    knob.setAttribute("aria-hidden", "true");
    var update = function () { box.style.setProperty("--pk-split", range.value + "%"); };
    range.addEventListener("input", update);
    box.appendChild(range);
    box.appendChild(knob);
    box.classList.add("pk-before-after__compare--live");
    update();
  });

  // Light and dark switch, for pages that offer both
  if (root.getAttribute("data-pk-mode") === "both") {
    var key = "pk-scheme:" + location.pathname.replace(/\/(ar|en)\/?$/, "");
    var stored = null;
    try { stored = localStorage.getItem(key); } catch (e) {}
    var systemDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    var dark = stored ? stored === "dark" : systemDark;
    var toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "pk-scheme-toggle";
    toggle.setAttribute("aria-label", root.getAttribute("lang") === "ar" ? "الوضع الداكن" : "Dark mode");
    var apply = function () {
      root.setAttribute("data-pk-scheme", dark ? "dark" : "light");
      toggle.setAttribute("aria-pressed", dark ? "true" : "false");
    };
    toggle.addEventListener("click", function () {
      dark = !dark;
      apply();
      try { localStorage.setItem(key, dark ? "dark" : "light"); } catch (e) {}
    });
    var nav = root.querySelector(".pk-nav");
    if (nav) nav.insertBefore(toggle, nav.querySelector(".pk-nav__cta, .pk-nav__menu"));
    else { toggle.classList.add("pk-scheme-toggle--floating"); root.appendChild(toggle); }
    apply();
  }

  // Smooth scroll reveal for sections below the fold
  if (!calm && animation !== "none") {
    var sections = Array.prototype.filter.call(root.querySelectorAll(".pk-section"), function (el) {
      return !el.classList.contains("pk-navbar") && !el.classList.contains("pk-hero") && el.getBoundingClientRect().top > window.innerHeight * 0.92;
    });
    sections.forEach(function (el) { el.classList.add("pk-reveal"); });
    onView(sections, function (el) { el.classList.add("pk-in"); });
  }
})();
`;
