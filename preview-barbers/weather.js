/* Live weather on the storefront photo (Jean, 2026-11-14).
   When the site opens, it asks the U.S. National Weather Service (free, no key, no account) what the
   sky is doing right now at Boston Logan, 2 miles from the shop, and plays that over the outside photo:
   rain, thunderstorm, snow or fog. In fall (Sep 22 – Dec 20) leaves blow past and lie on the sidewalk.
   Clear day outside of fall: the photo is left exactly as it is.
   Test any look by adding ?weather=rain | storm | snow | fog | leaves | clear to the address.
   If the weather service doesn't answer, only the season (leaves in fall) is shown. */
(function () {
  "use strict";
  var entrance = document.getElementById("entrance");
  var front = document.getElementById("storefront");
  if (!entrance || !front || entrance.classList.contains("is-gone")) return;

  var FEED = "https://api.weather.gov/stations/KBOS/observations/latest";
  var KEY = "tribe-weather", FRESH = 10 * 60 * 1000;
  var calm = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---------- what to show ----------
  function isFall() {
    var p = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", month: "numeric", day: "numeric" }).formatToParts(new Date());
    var m = +p.find(function (x) { return x.type === "month"; }).value, d = +p.find(function (x) { return x.type === "day"; }).value;
    var n = m * 100 + d;
    return n >= 922 && n <= 1220;
  }
  function fromText(t) {
    t = (t || "").toLowerCase();
    if (/thunder|t-storm|tstorm/.test(t)) return "storm";
    if (/snow|flurr|blizzard|sleet|ice pellets|wintry|freezing/.test(t)) return "snow";
    if (/rain|drizzle|shower/.test(t)) return "rain";
    if (/fog|mist|haze|smoke/.test(t)) return "fog";
    return "clear";
  }
  var forced = (location.search.match(/[?&]weather=([a-z]+)/) || [])[1];
  var sky = "clear", leaves = isFall();
  if (forced) { leaves = forced === "leaves"; sky = forced === "leaves" ? "clear" : forced; }

  // ---------- layers ----------
  var tint = document.createElement("div");
  tint.className = "weather-tint";
  tint.setAttribute("aria-hidden", "true");
  var canvas = document.createElement("canvas");
  canvas.className = "weather-fx";
  canvas.setAttribute("aria-hidden", "true");
  var flash = document.createElement("div");
  flash.className = "weather-flash";
  flash.setAttribute("aria-hidden", "true");
  var ctx = canvas.getContext("2d");
  if (!ctx) return;
  front.appendChild(tint); front.appendChild(canvas); front.appendChild(flash);

  var W = 0, H = 0, dpr = 1;
  function size() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = front.offsetWidth, h = front.offsetHeight;
    if (!w || !h) return;
    if (canvas.width !== Math.round(w * dpr)) { canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr); }
    W = w; H = h;
  }

  // ---------- particles (positions in 0..1 of the photo, so they fit any screen) ----------
  var rnd = Math.random;
  var LEAF = ["#C8551B", "#E08A1E", "#B23A12", "#D9A521", "#8A4B1C", "#A8281A"];
  var drops = [], flakes = [], falling = [], ground = [];
  function build() {
    drops = []; flakes = []; falling = []; ground = [];
    var i, n;
    if (sky === "rain" || sky === "storm") {
      n = sky === "storm" ? 260 : 170;
      for (i = 0; i < n; i++) drops.push({ x: rnd() * 1.3 - .15, y: rnd(), l: .025 + rnd() * .03, v: .9 + rnd() * .7, a: .25 + rnd() * .35 });
    }
    if (sky === "snow") {
      for (i = 0; i < 150; i++) flakes.push({ x: rnd(), y: rnd(), r: .0018 + rnd() * .0042, v: .05 + rnd() * .09, s: rnd() * 6.3, w: .4 + rnd() * .9, a: .55 + rnd() * .45 });
    }
    if (leaves) {
      n = sky === "clear" || sky === "fog" ? 16 : 7;       // fewer leaves in the air when it is raining or snowing
      for (i = 0; i < n; i++) falling.push(newLeaf(true));
      // leaves lying on the sidewalk and the front step (the ground starts about 78% down the photo)
      for (i = 0; i < 46; i++) {
        var y = .8 + Math.pow(rnd(), .8) * .19;
        ground.push({ x: rnd(), y: y, s: (.011 + rnd() * .012) * (.55 + (y - .78) * 2.6), r: rnd() * 6.3, c: LEAF[(rnd() * LEAF.length) | 0], f: .35 + rnd() * .5 });
      }
      for (i = 0; i < 5; i++) ground.push({ x: .36 + rnd() * .3, y: .765 + rnd() * .02, s: .01 + rnd() * .004, r: rnd() * 6.3, c: LEAF[(rnd() * LEAF.length) | 0], f: .4 + rnd() * .4 });
    }
    tint.className = "weather-tint is-" + sky + (leaves ? " is-fall" : "");
    entrance.setAttribute("data-weather", sky + (leaves ? " leaves" : ""));
  }
  function newLeaf(anywhere) {
    return { x: rnd() * 1.2 - .2, y: anywhere ? rnd() * .8 : -.05, s: .012 + rnd() * .014, r: rnd() * 6.3, vr: (rnd() - .5) * 3,
      t: rnd() * 6.3, vt: 1.5 + rnd() * 2.5, vx: .05 + rnd() * .09, vy: .07 + rnd() * .08, sw: rnd() * 6.3, c: LEAF[(rnd() * LEAF.length) | 0] };
  }
  function leafShape(x, y, s, rot, flip, color, alpha) {
    ctx.save();
    ctx.translate(x, y); ctx.rotate(rot); ctx.scale(1, flip);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(-s, 0);
    ctx.quadraticCurveTo(-s * .2, -s * .75, s, 0);
    ctx.quadraticCurveTo(-s * .2, s * .75, -s, 0);
    ctx.fill();
    ctx.strokeStyle = "rgba(60,30,8,.55)"; ctx.lineWidth = Math.max(.6, s * .09);
    ctx.beginPath(); ctx.moveTo(-s * 1.25, 0); ctx.lineTo(s * .8, 0); ctx.stroke();
    ctx.restore();
  }

  function draw(dt, now) {
    var i, p;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    // lying leaves first, with a soft shadow so they sit on the ground
    for (i = 0; i < ground.length; i++) {
      p = ground[i];
      leafShape(p.x * W + 1.5, p.y * H + 1.5, p.s * W, p.r, p.f, "#000", .28);
      leafShape(p.x * W, p.y * H, p.s * W, p.r, p.f, p.c, .95);
    }
    for (i = 0; i < falling.length; i++) {
      p = falling[i];
      p.sw += dt * 1.6; p.t += dt * p.vt; p.r += dt * p.vr;
      p.x += (p.vx + Math.sin(p.sw) * .05) * dt; p.y += p.vy * dt;
      if (p.y > .97 || p.x > 1.1) falling[i] = p = newLeaf(false);
      leafShape(p.x * W, p.y * H, p.s * W, p.r, Math.cos(p.t) * .85 + .15 * (Math.cos(p.t) < 0 ? -1 : 1), p.c, .95);
    }
    if (drops.length) {
      ctx.lineCap = "round"; ctx.lineWidth = Math.max(1, W * .0022);
      for (i = 0; i < drops.length; i++) {
        p = drops[i];
        p.y += p.v * dt * 1.5; p.x += p.v * dt * .22;
        if (p.y > 1.02) { p.y = -.06; p.x = rnd() * 1.3 - .2; }
        ctx.strokeStyle = "rgba(214,228,240," + p.a + ")";
        ctx.beginPath(); ctx.moveTo(p.x * W, p.y * H); ctx.lineTo((p.x + p.l * .15) * W, (p.y + p.l) * H); ctx.stroke();
      }
    }
    if (flakes.length) {
      ctx.fillStyle = "#fff";
      for (i = 0; i < flakes.length; i++) {
        p = flakes[i];
        p.s += dt * p.w; p.y += p.v * dt; p.x += Math.sin(p.s) * .012 * dt + .01 * dt;
        if (p.y > 1.01) { p.y = -.02; p.x = rnd(); }
        if (p.x > 1.02) p.x = -.02;
        ctx.globalAlpha = p.a;
        ctx.beginPath(); ctx.arc(p.x * W, p.y * H, Math.max(1, p.r * W), 0, 6.3); ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    if (sky === "storm" && !calm && now > nextFlash) {
      flash.classList.remove("is-on"); void flash.offsetWidth; flash.classList.add("is-on");
      nextFlash = now + 2600 + rnd() * 3200;
    }
  }

  // ---------- run only while the storefront is on screen ----------
  var raf = 0, last = 0, nextFlash = performance.now() + 700, active = false;
  function frame(now) {
    raf = 0;
    if (entrance.classList.contains("is-gone") || document.hidden) { active = false; return; }
    size();
    var dt = Math.min(.05, (now - (last || now)) / 1000); last = now;
    if (W) draw(calm ? 0 : dt, now);
    if (!calm && (drops.length || flakes.length || falling.length)) raf = requestAnimationFrame(frame);
    else active = false;
  }
  function start() {
    build();
    size();
    last = 0;
    if (!raf) { active = true; raf = requestAnimationFrame(frame); }
  }
  document.addEventListener("visibilitychange", function () { if (!document.hidden && !raf && !entrance.classList.contains("is-gone")) raf = requestAnimationFrame(frame); });
  window.addEventListener("resize", function () { if (!raf && !entrance.classList.contains("is-gone")) raf = requestAnimationFrame(frame); });

  start();                                   // the season shows straight away
  if (forced) return;

  // ---------- real weather ----------
  function apply(s) { if (s !== sky) { sky = s; start(); } }
  try {
    var saved = JSON.parse(localStorage.getItem(KEY) || "null");
    if (saved && Date.now() - saved.at < FRESH) { apply(saved.sky); return; }
  } catch (e) {}
  if (!window.fetch) return;
  var ctl = window.AbortController ? new AbortController() : null;
  if (ctl) setTimeout(function () { ctl.abort(); }, 4000);
  fetch(FEED, { headers: { Accept: "application/geo+json" }, signal: ctl ? ctl.signal : undefined })
    .then(function (r) { if (!r.ok) throw new Error("weather " + r.status); return r.json(); })
    .then(function (j) {
      var pr = (j && j.properties) || {};
      var words = [pr.textDescription].concat((pr.presentWeather || []).map(function (w) { return w.rawString || w.weather || ""; })).join(" ");
      var s = fromText(words);
      try { localStorage.setItem(KEY, JSON.stringify({ sky: s, at: Date.now() })); } catch (e) {}
      apply(s);
    })
    .catch(function () { /* no answer: keep the season only */ });
})();
