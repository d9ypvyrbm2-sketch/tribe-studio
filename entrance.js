/* The Tribe Studio test site: storefront entrance.
   Click (or press Enter on) the door: it swings open, the view walks through, and the homepage appears.
   A link straight to a section (#services, #visit...) skips the entrance. */
(function () {
  "use strict";

  var root = document.documentElement;
  var entrance = document.getElementById("entrance");
  if (!entrance) return;
  var door = document.getElementById("door-hotspot");
  var skip = document.getElementById("entrance-skip");
  var calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var leaving = false;

  // Opening title: one span per letter so each can blur into focus in turn.
  var filmName = document.getElementById("film-name");
  if (filmName) {
    var text = filmName.textContent;
    filmName.textContent = "";
    text.split("").forEach(function (ch, i) {
      var s = document.createElement("span");
      s.className = "char";
      s.style.setProperty("--index", String(i));
      s.textContent = ch;
      filmName.appendChild(s);
    });
  }

  function finish() {
    entrance.classList.add("is-gone");
    entrance.setAttribute("aria-hidden", "true");
    root.classList.remove("entrance-open");
    // Through the door: the inside of the shop is the homepage (shop.js).
    if (window.TribeShop && !window.TribeShop.isAway()) {
      window.TribeShop.show();
      return;
    }
    var main = document.getElementById("main");
    if (main) {
      main.setAttribute("tabindex", "-1");
      main.focus({ preventScroll: true });
    }
  }

  function enter(walkThrough) {
    if (leaving) return;
    leaving = true;
    if (!walkThrough) {
      entrance.classList.add("is-skipping");
      setTimeout(finish, 300);
      return;
    }
    entrance.classList.add("is-opening");
    setTimeout(function () { entrance.classList.add("is-walking"); }, calm ? 50 : 900);
    setTimeout(finish, calm ? 400 : 3000);
  }

  if (location.hash && location.hash !== "#top") {
    finish();
    return;
  }

  root.classList.add("entrance-open");
  window.scrollTo(0, 0);
  door.addEventListener("click", function () { enter(true); });
  skip.addEventListener("click", function () { enter(false); });
  entrance.addEventListener("keydown", function (e) {
    if (e.key === "Escape") enter(false);
  });
  door.focus({ preventScroll: true });
})();
