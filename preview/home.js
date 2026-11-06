/* The Tribe Studio: friendly touches for the "at home" theme (Jean, 2026-11-05).
   1. "Open now / Closed" status, worked out in Boston time, shown under the hero buttons and in the hours card.
   2. A one-time greeting from the robot ("Welcome to the shop!") the first time a visitor reaches the shop.
   Hours must match the hours table in index.html: Mon–Sat 9 AM–8 PM, Sun 10 AM–4 PM. */
(function () {
  "use strict";

  var root = document.documentElement;
  var HOURS = { 0: [10, 16], 1: [9, 20], 2: [9, 20], 3: [9, 20], 4: [9, 20], 5: [9, 20], 6: [9, 20] };
  var DAYS = { en: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
               es: ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"] };
  var TEXT = {
    en: { open: "Open now", until: "until", closed: "Closed now", opens: "opens", today: "today", tomorrow: "tomorrow",
          hello: "Welcome to the shop! Ask me anything.",
          inside: "Welcome to the shop! Tap a chair to look around, or ask me anything." },
    es: { open: "Abierto ahora", until: "hasta las", closed: "Cerrado ahora", opens: "abre", today: "hoy", tomorrow: "mañana",
          hello: "¡Bienvenido a la barbería! Pregúntame lo que quieras.",
          inside: "¡Bienvenido a la barbería! Toca una silla para mirar, o pregúntame lo que quieras." }
  };

  function lang() { return (root.lang || "en").slice(0, 2) === "es" ? "es" : "en"; }
  function clock(h) { var s = h >= 12 ? "PM" : "AM"; return (h % 12 || 12) + " " + s; }

  // Current day and hour in Boston, whatever the visitor's own time zone.
  function bostonNow() {
    var parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", weekday: "short", hour: "numeric", minute: "numeric", hourCycle: "h23" })
      .formatToParts(new Date());
    var get = function (t) { return parts.filter(function (p) { return p.type === t; })[0].value; };
    var day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday"));
    return { day: day, hour: Number(get("hour")) + Number(get("minute")) / 60 };
  }

  function statusText() {
    var t = TEXT[lang()], now = bostonNow(), h = HOURS[now.day];
    if (now.hour >= h[0] && now.hour < h[1]) return { open: true, text: t.open + " · " + t.until + " " + clock(h[1]) };
    if (now.hour < h[0]) return { open: false, text: t.closed + " · " + t.opens + " " + t.today + " " + clock(h[0]) };
    var next = (now.day + 1) % 7;
    return { open: false, text: t.closed + " · " + t.opens + " " + t.tomorrow + " " + clock(HOURS[next][0]) };
  }

  var pills = [];
  function addPill(after, extra) {
    if (!after) return;
    var p = document.createElement("p");
    p.className = "open-status " + (extra || "");
    p.setAttribute("aria-live", "polite");
    after.insertAdjacentElement("afterend", p);
    pills.push(p);
  }
  addPill(document.querySelector(".fx-hero-cta"), "open-status-hero");
  addPill(document.querySelector(".fx-hours-title"), "open-status-hours");

  function paint() {
    var s = statusText();
    pills.forEach(function (p) { p.textContent = s.text; p.classList.toggle("is-open", s.open); });
  }
  paint();
  setInterval(paint, 60000);
  // Repaint when the visitor switches between English and Spanish (main.js updates <html lang>).
  new MutationObserver(paint).observe(root, { attributes: true, attributeFilter: ["lang"] });

  // Robot greeting: once per visit, a few seconds after the visitor is through the door.
  var KEY = "tribe-greeted";
  function greeted() { try { return sessionStorage.getItem(KEY) === "1"; } catch (e) { return true; } }
  function markGreeted() { try { sessionStorage.setItem(KEY, "1"); } catch (e) { /* ignore */ } }

  // Show one speech bubble above the robot; tapping it opens the chat.
  function say(text) {
    var launcher = document.querySelector("#tribe-assistant .ta-launcher");
    var box = document.getElementById("tribe-assistant");
    if (!launcher || box.classList.contains("is-open")) return;
    var old = document.querySelector(".robot-hello");
    if (old) old.remove();
    var r = launcher.getBoundingClientRect();
    var b = document.createElement("button");
    b.type = "button";
    b.className = "robot-hello";
    b.textContent = text;
    b.style.bottom = Math.round(window.innerHeight - r.top + 8) + "px";
    var centre = r.left + r.width / 2;
    if (centre > window.innerWidth * 0.66) { b.style.right = Math.round(window.innerWidth - r.right) + "px"; b.classList.add("is-right"); }
    else { b.style.left = Math.round(centre) + "px"; b.classList.add("is-centre"); }
    document.body.appendChild(b);
    requestAnimationFrame(function () { b.classList.add("is-in"); });
    var gone = false;
    function hide() { if (gone) return; gone = true; b.classList.remove("is-in"); setTimeout(function () { b.remove(); }, 300); }
    b.addEventListener("click", function () { hide(); launcher.click(); });
    launcher.addEventListener("click", hide, { once: true });
    setTimeout(hide, 7000);
  }

  function greet() {
    if (greeted()) return;
    markGreeted();
    say(TEXT[lang()].hello);
  }

  // Jean, 2026-11-05: every time a visitor taps "Inside the shop", the robot welcomes them in
  // (after the shop has appeared and the robot has moved to the centre).
  var inside = document.getElementById("nav-inside");
  if (inside) inside.addEventListener("click", function () {
    markGreeted();
    setTimeout(function () { say(TEXT[lang()].inside); }, 900);
  });

  // Wait until the entrance has finished (the robot is hidden while it plays).
  var timer = setInterval(function () {
    if (root.classList.contains("entrance-open")) return;
    clearInterval(timer);
    setTimeout(greet, 2600); // after the robot and the chairs have appeared
  }, 500);
})();
