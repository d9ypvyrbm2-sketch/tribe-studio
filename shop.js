/* The Tribe Studio test site: inside the shop (the homepage).
   Each chair opens one part of the site. Tap a chair: the camera moves onto it, then that chair's own
   photo fills the screen with its information floating over it. "Back to the shop" reverses the move. */
(function () {
  "use strict";

  var root = document.documentElement;
  var shop = document.getElementById("shop");
  if (!shop) return;
  var scene = document.getElementById("shop-scene");
  var calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var chairs = Array.prototype.slice.call(shop.querySelectorAll(".chair"));
  var busy = false, current = null, open = null;

  chairs.forEach(function (chair, i) { chair.style.setProperty("--i", String(i)); });

  // Stagger the floating lines of every station.
  document.querySelectorAll(".station").forEach(function (st) {
    var n = 0;
    st.querySelectorAll(".station-air > *, .air-names > li, .air-menu > li, .air-hours > div").forEach(function (el) {
      el.style.setProperty("--d", String(n++));
    });
    st.querySelector(".station-back").addEventListener("click", closeStation);
  });

  // Mark today's hours (0 = Sunday).
  var today = new Date().getDay();
  document.querySelectorAll('.air-hours > div[data-day="' + today + '"]').forEach(function (row) { row.classList.add("is-today"); });

  function show() {
    shop.classList.remove("is-away");
    root.classList.add("shop-open");
    shop.classList.remove("is-arriving");
    void shop.offsetWidth; // restart the chair animation
    shop.classList.add("is-arriving");
    shop.setAttribute("tabindex", "-1");
    shop.focus({ preventScroll: true });
  }

  function leave() {
    shop.classList.add("is-away");
    root.classList.remove("shop-open");
    window.scrollTo(0, 0);
    var main = document.getElementById("main");
    if (main) { main.setAttribute("tabindex", "-1"); main.focus({ preventScroll: true }); }
  }

  function openStation(chair) {
    var st = document.getElementById("station-" + chair.dataset.chair);
    if (!st) { busy = false; return; }
    open = st;
    shop.inert = true; // keep Tab inside the open chair
    st.hidden = false;
    void st.offsetWidth;
    st.classList.add("is-in");
    st.querySelector(".station-back").focus({ preventScroll: true });
    setTimeout(function () { busy = false; }, calm ? 0 : 600);
  }

  function focusChair(chair) {
    if (busy || current) return;
    busy = true;
    current = chair;
    var cs = getComputedStyle(chair);
    scene.style.transformOrigin = cs.getPropertyValue("--x").trim() + " " + cs.getPropertyValue("--y").trim();
    shop.classList.add("is-focused");
    setTimeout(function () { openStation(chair); }, calm ? 0 : 900);
  }

  function closeStation() {
    if (busy || !open) return;
    busy = true;
    var st = open;
    st.classList.remove("is-in");
    setTimeout(function () {
      st.hidden = true;
      open = null;
      shop.inert = false;
      shop.classList.remove("is-focused");
      var back = current;
      setTimeout(function () {
        current = null;
        busy = false;
        if (back) back.focus({ preventScroll: true });
      }, calm ? 0 : 900);
    }, calm ? 0 : 600);
  }

  chairs.forEach(function (chair) {
    chair.addEventListener("click", function () { focusChair(chair); });
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && open) closeStation();
  });
  document.getElementById("shop-more").addEventListener("click", leave);
  var navInside = document.getElementById("nav-inside");
  if (navInside) navInside.addEventListener("click", function (e) { e.preventDefault(); window.scrollTo(0, 0); show(); });

  // A link straight to a section (#services, #visit...) opens the full site instead of the shop.
  if (location.hash && location.hash !== "#top" && location.hash !== "#inside") shop.classList.add("is-away");
  else root.classList.add("shop-open");

  window.TribeShop = { show: show, isAway: function () { return shop.classList.contains("is-away"); } };
})();
