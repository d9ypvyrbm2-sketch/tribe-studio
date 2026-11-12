/* Inside-the-shop photo in 3D (Jean, 2026-11-12).
   A WebGL layer redraws the real photo using a depth map (img/tribe-studio-interior-depth.png:
   white = near, black = far), so the floor, chairs and back wall shift by different amounts
   as the visitor moves the mouse, drags a finger, or tilts an Android phone. When nobody moves,
   the view drifts gently so it still reads as 3D. If WebGL or the images fail, or the visitor
   prefers reduced motion, nothing changes: the flat photo behind stays as it is. */
(function () {
  "use strict";
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  var scene = document.getElementById("shop-scene");
  var shop = document.getElementById("shop");
  if (!scene || !shop) return;

  var PHOTO = "img/tribe-studio-barbershop-interior-east-boston.webp";
  var DEPTH = "img/tribe-studio-interior-depth.png";
  var STRENGTH = 0.026;      // biggest shift, as a share of the photo's width
  var FOCUS = 0.32;          // depth that stays still (about the middle chairs), so labels stay on their chairs

  var canvas = document.createElement("canvas");
  canvas.className = "shop-depth";
  canvas.setAttribute("aria-hidden", "true");
  var gl = canvas.getContext("webgl", { alpha: false, antialias: false, premultipliedAlpha: false });
  if (!gl) return;

  var VS = "attribute vec2 p; varying vec2 uv;" +
    "void main(){ uv = vec2(p.x * .5 + .5, .5 - p.y * .5); gl_Position = vec4(p, 0., 1.); }";
  var FS = "precision mediump float; varying vec2 uv; uniform sampler2D img, dep; uniform vec2 off; uniform float focus;" +
    "void main(){" +
    "  vec2 q = uv; float d;" +
    // a few steps so near things slide over far things instead of smearing
    "  for (int i = 0; i < 4; i++) { d = texture2D(dep, q).r; q = uv + off * (d - focus); }" +
    "  gl_FragColor = texture2D(img, clamp(q, vec2(.001), vec2(.999)));" +
    "}";

  function shader(type, src) {
    var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
    return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
  }
  var vs = shader(gl.VERTEX_SHADER, VS), fs = shader(gl.FRAGMENT_SHADER, FS);
  if (!vs || !fs) return;
  var prog = gl.createProgram();
  gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
  gl.useProgram(prog);

  var buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  var loc = gl.getAttribLocation(prog, "p");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  var uOff = gl.getUniformLocation(prog, "off");
  gl.uniform1f(gl.getUniformLocation(prog, "focus"), FOCUS);
  gl.uniform1i(gl.getUniformLocation(prog, "img"), 0);
  gl.uniform1i(gl.getUniformLocation(prog, "dep"), 1);

  function texture(unit, image) {
    var t = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  }
  function load(src) {
    return new Promise(function (ok, bad) { var i = new Image(); i.onload = function () { ok(i); }; i.onerror = bad; i.src = src; });
  }

  // ---- where the viewer is "looking from" (-1..1 on each axis) ----
  var target = { x: 0, y: 0 }, cur = { x: 0, y: 0 }, lastInput = -1e9, t0 = performance.now();
  function aim(x, y) {
    target.x = Math.max(-1, Math.min(1, x)); target.y = Math.max(-1, Math.min(1, y));
    lastInput = performance.now();
  }
  function fromPoint(e) {
    var r = scene.getBoundingClientRect();
    if (!r.width) return;
    aim(((e.clientX - r.left) / r.width - .5) * 2, ((e.clientY - r.top) / r.height - .5) * 2);
  }
  shop.addEventListener("pointermove", fromPoint, { passive: true });
  shop.addEventListener("touchmove", function (e) { if (e.touches[0]) fromPoint(e.touches[0]); }, { passive: true });
  var base = null;
  window.addEventListener("deviceorientation", function (e) {   // Android tilt (iPhone needs a permission prompt, so it uses the drift)
    if (e.beta == null || e.gamma == null) return;
    if (!base) base = { b: e.beta, g: e.gamma };
    aim((e.gamma - base.g) / 18, (e.beta - base.b) / 18);
  }, { passive: true });

  // ---- drawing ----
  var running = false, raf = 0;
  function size() {
    var r = scene.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = Math.round(r.width / (parseFloat(getComputedStyle(scene).scale) || 1) * dpr);
    var h = Math.round(w * 4 / 3);
    if (w > 0 && (canvas.width !== w || canvas.height !== h)) { canvas.width = w; canvas.height = h; gl.viewport(0, 0, w, h); }
  }
  function frame(now) {
    raf = 0;
    if (!running) return;
    var idle = now - lastInput > 2500;
    if (idle) {                                   // slow figure-eight drift when nobody is moving
      var s = (now - t0) / 1000;
      target.x = Math.sin(s * .45) * .75; target.y = Math.sin(s * .3) * .35;
    }
    var k = idle ? .03 : .09;
    cur.x += (target.x - cur.x) * k; cur.y += (target.y - cur.y) * k;
    var focused = shop.classList.contains("is-focused");
    var amt = STRENGTH * (focused ? .35 : 1);
    gl.uniform2f(uOff, cur.x * amt, cur.y * amt * .6);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    raf = requestAnimationFrame(frame);
  }
  function update() {
    var on = !document.hidden && !shop.classList.contains("is-away") && !document.querySelector(".station.is-in");
    if (on && !running) { running = true; size(); raf = requestAnimationFrame(frame); }
    if (!on && running) { running = false; if (raf) cancelAnimationFrame(raf); raf = 0; }
  }

  Promise.all([load(PHOTO), load(DEPTH)]).then(function (imgs) {
    texture(0, imgs[0]); texture(1, imgs[1]);
    scene.insertBefore(canvas, scene.firstChild);
    size();
    gl.uniform2f(uOff, 0, 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    scene.classList.add("has-depth");
    new MutationObserver(update).observe(shop, { attributes: true, attributeFilter: ["class"] });
    new MutationObserver(update).observe(document.body, { subtree: true, attributes: true, attributeFilter: ["class"] });
    document.addEventListener("visibilitychange", update);
    window.addEventListener("resize", size);
    update();
  }).catch(function () { /* keep the flat photo */ });

  canvas.addEventListener("webglcontextlost", function (e) {   // the flat photo shows again if the graphics card resets
    e.preventDefault(); running = false; scene.classList.remove("has-depth"); canvas.remove();
  });
})();
