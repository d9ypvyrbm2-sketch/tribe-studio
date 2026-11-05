/* Tribe Assistant: the website's AI receptionist (front end).
   Vanilla JS, no libraries. Adds one floating button and a chat panel; touches nothing else on the page.
   Setup: <script src="assistant/tribe-assistant.js" data-api="https://YOUR-PROJECT.vercel.app" defer></script>
   No API keys live here. The browser only talks to the Vercel backend, which holds the key. */
(function () {
  "use strict";

  var script = document.currentScript;
  var API = ((script && script.getAttribute("data-api")) || window.TRIBE_ASSISTANT_API || "").replace(/\/+$/, "");
  var BOOKSY = "https://booksy.com/en-us/1023543_the-tribe-studio-1-maverick_barber-shop_22412_boston";
  var INSTAGRAM = "https://www.instagram.com/thetribestudiobarbershop/";
  var PHONE = "+18573349508", PHONE_LABEL = "(857) 334-9508";
  var STORE = "tribe-assistant-v1";
  var root = document.documentElement;

  var T = {
    en: {
      launcher: "Ask Tribe", open: "Open the Tribe Studio assistant", close: "Close the assistant",
      title: "Tribe Studio", sub: "Assistant · online",
      welcome: "Hey, welcome to The Tribe Studio! I can help with prices, barbers, hours, directions and booking. What can I do for you?",
      placeholder: "Type your question…", send: "Send",
      suggestions: ["How much is a haircut?", "Can I book with Jean Carlos?", "Are you open today?", "Where are you located?"],
      kicker: "Your booking", service: "Service", barber: "Barber", date: "Date", time: "Time",
      anyBarber: "Any barber", bookBtn: "Continue on Booksy →",
      bookNote: "On Booksy, pick this service and barber, then choose an open time. Booksy shows live availability.",
      fine: "AI assistant · prices from Booksy and may change · don't share sensitive info",
      errNet: "I couldn't connect just now. You can still book directly on Booksy.",
      errBusy: "I'm getting a lot of messages. Give me a minute, or book directly on Booksy.",
      errOff: "The assistant isn't switched on yet. You can book directly on Booksy.",
      retry: "Try again", bookDirect: "Book on Booksy",
      inqKicker: "Send your question to the shop",
      inqName: "Your name", inqContact: "Phone or email", inqMsg: "Your question",
      inqConsent: "I agree that The Tribe Studio may contact me about this question. My details are only used to reply.",
      inqSend: "Send to the shop", inqCancel: "Not now",
      inqOk: "Sent! The shop will get back to you.",
      inqFail: "That didn't go through. You can call the shop or message them on Instagram instead.",
      inqOff: "Messages to the shop aren't set up yet. You can call the shop or reach them on Instagram.",
      inqInvalid: "Please check your name, a valid phone or email, and your question.",
      inqConsentErr: "Please tick the box so the shop can reply to you.",
      instagram: "Message on Instagram", call: "Call",
      newtab: "(opens in a new tab)", restart: "Start over"
    },
    es: {
      launcher: "Pregúntanos", open: "Abrir el asistente de The Tribe Studio", close: "Cerrar el asistente",
      title: "Tribe Studio", sub: "En línea",
      welcome: "¡Hola, bienvenido a The Tribe Studio! Te ayudo con precios, barberos, horario, cómo llegar y reservas. ¿En qué te ayudo?",
      placeholder: "Escribe tu pregunta…", send: "Enviar",
      suggestions: ["¿Cuánto cuesta un corte?", "¿Puedo reservar con Jean Carlos?", "¿Están abiertos hoy?", "¿Dónde están ubicados?"],
      kicker: "Tu reserva", service: "Servicio", barber: "Barbero", date: "Fecha", time: "Hora",
      anyBarber: "Cualquier barbero", bookBtn: "Continuar en Booksy →",
      bookNote: "En Booksy, elige este servicio y barbero, y luego una hora disponible. Booksy muestra la disponibilidad en vivo.",
      fine: "Asistente con IA · precios de Booksy, pueden cambiar · no compartas datos sensibles",
      errNet: "No pude conectarme ahora. Igual puedes reservar directo en Booksy.",
      errBusy: "Estoy recibiendo muchos mensajes. Dame un minuto o reserva directo en Booksy.",
      errOff: "El asistente aún no está activado. Puedes reservar directo en Booksy.",
      retry: "Intentar de nuevo", bookDirect: "Reservar en Booksy",
      inqKicker: "Envía tu pregunta a la barbería",
      inqName: "Tu nombre", inqContact: "Teléfono o correo", inqMsg: "Tu pregunta",
      inqConsent: "Acepto que The Tribe Studio me contacte sobre esta pregunta. Mis datos solo se usan para responder.",
      inqSend: "Enviar a la barbería", inqCancel: "Ahora no",
      inqOk: "¡Enviado! La barbería te responderá.",
      inqFail: "No se pudo enviar. Puedes llamar a la barbería o escribirles por Instagram.",
      inqOff: "Los mensajes a la barbería aún no están configurados. Puedes llamar o escribirles por Instagram.",
      inqInvalid: "Revisa tu nombre, un teléfono o correo válido y tu pregunta.",
      inqConsentErr: "Marca la casilla para que la barbería pueda responderte.",
      instagram: "Escribir por Instagram", call: "Llamar",
      newtab: "(se abre en una pestaña nueva)", restart: "Empezar de nuevo"
    }
  };
  var SVC_ES = {
    "Haircut": "Corte de cabello", "Haircut with Andres": "Corte con Andres", "Haircut & Beard": "Corte y barba",
    "Haircut & Beard with Andres": "Corte y barba con Andres", "VIP": "VIP", "Line up": "Line up (perfilado)", "Hair color": "Color de cabello"
  };

  /* ---------- State ---------- */
  var state = { lang: siteLang(), history: [], cards: [], open: false, busy: false, langLocked: false };
  try {
    var saved = JSON.parse(sessionStorage.getItem(STORE) || "null");
    if (saved && Array.isArray(saved.items)) { state.items = saved.items; state.lang = saved.lang || state.lang; }
  } catch (e) { /* storage blocked: start fresh */ }
  state.items = state.items || []; // [{type:"msg", role, text} | {type:"booking", data} | {type:"inquiry"}]

  function save() {
    try { sessionStorage.setItem(STORE, JSON.stringify({ items: state.items.slice(-60), lang: state.lang })); } catch (e) { /* ignore */ }
  }
  function siteLang() { return (root.getAttribute("lang") || "en").toLowerCase().indexOf("es") === 0 ? "es" : "en"; }
  function t(k) { return (T[state.lang] && T[state.lang][k]) || T.en[k]; }

  /* ---------- DOM ---------- */
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function svg(path) {
    var ns = "http://www.w3.org/2000/svg";
    var s = document.createElementNS(ns, "svg");
    s.setAttribute("viewBox", "0 0 24 24"); s.setAttribute("aria-hidden", "true");
    var p = document.createElementNS(ns, "path");
    p.setAttribute("d", path); p.setAttribute("fill", "none"); p.setAttribute("stroke", "currentColor");
    p.setAttribute("stroke-width", "2"); p.setAttribute("stroke-linecap", "round"); p.setAttribute("stroke-linejoin", "round");
    s.appendChild(p);
    return s;
  }

  var wrap = el("div"); wrap.id = "tribe-assistant";
  var launcher = el("button", "ta-launcher"); launcher.type = "button";
  launcher.setAttribute("aria-haspopup", "dialog"); launcher.setAttribute("aria-expanded", "false");
  // The launcher is a small floating robot (inline SVG, no text, no image file).
  var BOT_SVG =
    '<svg class="ta-bot-svg" viewBox="0 0 80 96" aria-hidden="true" focusable="false">' +
    '<defs>' +
    '<radialGradient id="ta-shell" cx="38%" cy="28%" r="80%"><stop offset="0" stop-color="#ffffff"/><stop offset=".55" stop-color="#ece8e1"/><stop offset="1" stop-color="#b9b3a9"/></radialGradient>' +
    '<linearGradient id="ta-visor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a2722"/><stop offset="1" stop-color="#0b0a09"/></linearGradient>' +
    '<radialGradient id="ta-glow" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#fff3d2"/><stop offset=".45" stop-color="#e9c27a"/><stop offset="1" stop-color="#c9a35c" stop-opacity="0"/></radialGradient>' +
    '</defs>' +
    '<line x1="40" y1="12" x2="40" y2="4" stroke="#b9b3a9" stroke-width="2.2" stroke-linecap="round"/>' +
    '<circle class="ta-bot-antenna" cx="40" cy="4" r="3" fill="#c9a35c"/>' +
    '<ellipse cx="13" cy="66" rx="6" ry="10" fill="url(#ta-shell)"/>' +
    '<ellipse cx="67" cy="66" rx="6" ry="10" fill="url(#ta-shell)"/>' +
    '<path d="M18 62c0-12 10-20 22-20s22 8 22 20c0 13-9 22-22 22S18 75 18 62z" fill="url(#ta-shell)"/>' +
    '<circle cx="40" cy="64" r="8.5" fill="#15130f" stroke="#c9a35c" stroke-width="1.6"/>' +
    '<circle class="ta-bot-core" cx="40" cy="64" r="4.2" fill="url(#ta-glow)"/>' +
    '<rect x="17" y="12" width="46" height="34" rx="17" fill="url(#ta-shell)"/>' +
    '<rect x="22" y="18" width="36" height="21" rx="10.5" fill="url(#ta-visor)"/>' +
    '<g class="ta-bot-eyes"><rect x="29" y="22.5" width="7" height="12" rx="3.5" fill="#e9c27a"/><rect x="44" y="22.5" width="7" height="12" rx="3.5" fill="#e9c27a"/></g>' +
    '<path d="M25 20.5c3-1.6 6-2.2 10-2.2" stroke="#fff" stroke-opacity=".35" stroke-width="1.5" fill="none" stroke-linecap="round"/>' +
    '</svg>' +
    '<span class="ta-bot-shadow" aria-hidden="true"></span>';
  var lBot = el("span", "ta-robot"); lBot.setAttribute("aria-hidden", "true");
  lBot.innerHTML = BOT_SVG; // static markup written above, no user data
  var lText = el("span", "ta-launcher-text"); // screen-reader name only
  launcher.append(lBot, lText);
  try { if (!sessionStorage.getItem(STORE)) launcher.classList.add("is-new"); } catch (e) { launcher.classList.add("is-new"); }

  var panel = el("div", "ta-panel");
  panel.setAttribute("role", "dialog"); panel.setAttribute("aria-modal", "false"); panel.id = "ta-panel";
  launcher.setAttribute("aria-controls", "ta-panel");

  var head = el("div", "ta-head");
  var hMark = el("span", "ta-head-mark"); hMark.setAttribute("aria-hidden", "true");
  hMark.innerHTML = '<svg viewBox="0 0 48 40" aria-hidden="true" focusable="false">' +
    '<rect x="3" y="4" width="42" height="32" rx="16" fill="#ece8e1"/>' +
    '<rect x="8" y="10" width="32" height="19" rx="9.5" fill="#12110e"/>' +
    '<g class="ta-bot-eyes ta-head-eyes"><rect x="15" y="13.5" width="6" height="11" rx="3" fill="#e9c27a"/><rect x="27" y="13.5" width="6" height="11" rx="3" fill="#e9c27a"/></g>' +
    '</svg>';
  var hText = el("div", "ta-head-text");
  var title = el("h2", "ta-title"); title.id = "ta-title"; panel.setAttribute("aria-labelledby", "ta-title");
  var sub = el("p", "ta-sub");
  hText.append(title, sub);
  var langs = el("div", "ta-langs"); langs.setAttribute("role", "group"); langs.setAttribute("aria-label", "Language / Idioma");
  var bEn = el("button", "ta-lang", "EN"); bEn.type = "button"; bEn.lang = "en";
  var bEs = el("button", "ta-lang", "ES"); bEs.type = "button"; bEs.lang = "es";
  langs.append(bEn, bEs);
  var restartBtn = el("button", "ta-icon-btn"); restartBtn.type = "button";
  restartBtn.appendChild(svg("M4 4v6h6M20 20v-6h-6M5.5 15a7 7 0 0 0 12.3 2.3M18.5 9A7 7 0 0 0 6.2 6.7"));
  var closeBtn = el("button", "ta-icon-btn"); closeBtn.type = "button";
  closeBtn.appendChild(svg("M6 6l12 12M18 6 6 18"));
  head.append(hMark, hText, langs, restartBtn, closeBtn);

  var log = el("div", "ta-log");
  log.setAttribute("role", "log"); log.setAttribute("aria-live", "polite"); log.setAttribute("aria-relevant", "additions");
  var suggest = el("div", "ta-suggest");
  var form = el("form", "ta-compose");
  var input = el("textarea", "ta-input"); input.rows = 1; input.maxLength = 600; input.setAttribute("enterkeyhint", "send");
  var sendBtn = el("button", "ta-send"); sendBtn.type = "submit";
  sendBtn.appendChild(svg("M5 12h14M13 6l6 6-6 6"));
  form.append(input, sendBtn);
  var fine = el("p", "ta-fine");
  panel.append(head, log, suggest, form, fine);
  wrap.append(launcher, panel);
  document.body.appendChild(wrap);

  /* ---------- Rendering ---------- */
  var SAFE_LINK = /(https:\/\/(?:booksy\.com|www\.google\.com\/maps|maps\.google\.com|www\.instagram\.com)\/[^\s)]+)/g;
  function textWithLinks(node, text) {
    var parts = String(text).split(SAFE_LINK);
    parts.forEach(function (part, i) {
      if (i % 2 === 1) {
        var a = el("a", null, linkLabel(part));
        a.href = part; a.target = "_blank"; a.rel = "noopener noreferrer";
        node.appendChild(a);
      } else if (part) node.appendChild(document.createTextNode(part));
    });
  }
  function linkLabel(url) {
    if (url.indexOf("booksy.com") > -1) return "Booksy";
    if (url.indexOf("instagram.com") > -1) return "Instagram";
    return "Google Maps";
  }

  function renderItem(item) {
    if (item.type === "msg") {
      var m = el("div", "ta-msg " + (item.role === "user" ? "ta-user" : item.role === "error" ? "ta-error" : "ta-bot"));
      if (item.role === "user") m.textContent = item.text; else textWithLinks(m, item.text);
      log.appendChild(m);
      if (item.role === "error") log.appendChild(errorActions());
    } else if (item.type === "booking") {
      log.appendChild(bookingCard(item.data));
    } else if (item.type === "inquiry") {
      log.appendChild(inquiryCard(item));
    }
  }

  function renderAll() {
    log.textContent = "";
    var w = el("div", "ta-msg ta-bot", t("welcome"));
    log.appendChild(w);
    state.items.forEach(renderItem);
    renderSuggestions();
    scrollDown();
  }

  function renderSuggestions() {
    suggest.textContent = "";
    var hasUser = state.items.some(function (i) { return i.type === "msg" && i.role === "user"; });
    suggest.hidden = hasUser;
    if (hasUser) return;
    t("suggestions").forEach(function (q) {
      var c = el("button", "ta-chip", q); c.type = "button";
      c.addEventListener("click", function () { sendMessage(q); });
      suggest.appendChild(c);
    });
  }

  function bookingCard(b) {
    var card = el("div", "ta-card");
    card.appendChild(el("p", "ta-card-kicker", t("kicker")));
    var dl = el("dl");
    function row(label, value) { if (!value) return; dl.append(el("dt", null, label), el("dd", null, value)); }
    row(t("service"), state.lang === "es" ? (SVC_ES[b.service] || b.service) : b.service);
    row(t("barber"), b.barber === "Any barber" ? t("anyBarber") : b.barber);
    row(t("date"), b.date);
    row(t("time"), b.time);
    card.appendChild(dl);
    var a = el("a", "ta-btn ta-btn-gold", t("bookBtn"));
    a.href = BOOKSY; a.target = "_blank"; a.rel = "noopener noreferrer";
    a.setAttribute("aria-label", t("bookBtn").replace(" →", "") + " " + t("newtab"));
    card.appendChild(a);
    card.appendChild(el("p", "ta-card-note", t("bookNote")));
    return card;
  }

  function errorActions() {
    var row = el("div", "ta-row");
    var a = el("a", "ta-btn ta-btn-gold", t("bookDirect"));
    a.href = BOOKSY; a.target = "_blank"; a.rel = "noopener noreferrer";
    var r = el("button", "ta-btn ta-btn-ghost", t("retry")); r.type = "button";
    r.addEventListener("click", function () {
      // Drop the error and resend the last question.
      for (var i = state.items.length - 1; i >= 0; i--) if (state.items[i].role === "error") { state.items.splice(i, 1); break; }
      var lastUser = null;
      for (var j = state.items.length - 1; j >= 0; j--) if (state.items[j].role === "user") { lastUser = state.items.splice(j, 1)[0]; break; }
      save(); renderAll();
      if (lastUser) sendMessage(lastUser.text);
    });
    row.append(a, r);
    return row;
  }

  function inquiryCard(item) {
    var card = el("div", "ta-card");
    card.appendChild(el("p", "ta-card-kicker", t("inqKicker")));
    if (item.done) {
      card.appendChild(el("p", null, item.done === "ok" ? t("inqOk") : item.done === "off" ? t("inqOff") : t("inqFail")));
      if (item.done !== "ok") {
        var acts = el("div", "ta-row"); acts.style.marginTop = "10px";
        var call = el("a", "ta-btn ta-btn-gold", t("call") + " " + PHONE_LABEL); call.href = "tel:" + PHONE;
        var ig = el("a", "ta-btn ta-btn-ghost", "Instagram");
        ig.href = INSTAGRAM; ig.target = "_blank"; ig.rel = "noopener noreferrer";
        ig.setAttribute("aria-label", t("instagram") + " " + t("newtab"));
        acts.append(call, ig);
        card.appendChild(acts);
      }
      return card;
    }
    var f = el("form", "ta-form"); f.noValidate = true;
    function field(label, tag, name, attrs) {
      var l = el("label", null, label);
      var i = el(tag); i.name = name;
      Object.keys(attrs || {}).forEach(function (k) { i.setAttribute(k, attrs[k]); });
      l.appendChild(i); f.appendChild(l); return i;
    }
    var name = field(t("inqName"), "input", "name", { autocomplete: "name", maxlength: "80", required: "" });
    var contact = field(t("inqContact"), "input", "contact", { autocomplete: "email", inputmode: "email", maxlength: "120", required: "" });
    var msg = field(t("inqMsg"), "textarea", "message", { maxlength: "1200", required: "" });
    msg.value = item.prefill || "";
    var hp = el("label", "ta-hp"); hp.setAttribute("aria-hidden", "true");
    var hpIn = el("input"); hpIn.name = "website"; hpIn.tabIndex = -1; hpIn.autocomplete = "off"; hp.appendChild(hpIn); f.appendChild(hp);
    var chk = el("label", "ta-check"); var cb = el("input"); cb.type = "checkbox"; cb.name = "consent";
    chk.append(cb, el("span", null, t("inqConsent"))); f.appendChild(chk);
    var err = el("p", "ta-form-err"); err.hidden = true; err.setAttribute("role", "alert"); f.appendChild(err);
    var row = el("div", "ta-row");
    var go = el("button", "ta-btn ta-btn-gold", t("inqSend")); go.type = "submit";
    var no = el("button", "ta-btn ta-btn-ghost", t("inqCancel")); no.type = "button";
    row.append(go, no); f.appendChild(row);
    no.addEventListener("click", function () {
      state.items.splice(state.items.indexOf(item), 1); save(); renderAll(); input.focus();
    });
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      err.hidden = true;
      if (!cb.checked) { err.textContent = t("inqConsentErr"); err.hidden = false; return; }
      var c = contact.value.trim();
      var validContact = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(c) || /^\+?[\d\s().-]{7,20}$/.test(c);
      if (name.value.trim().length < 2 || !validContact || msg.value.trim().length < 5) {
        err.textContent = t("inqInvalid"); err.hidden = false; return;
      }
      go.disabled = true;
      post("/api/inquiry", {
        name: name.value, contact: c, message: msg.value, lang: state.lang, consent: true, website: hpIn.value
      }).then(function (r) {
        item.done = r.ok ? "ok" : (r.status === 503 ? "off" : (r.status === 400 ? null : "fail"));
        if (item.done === null) { item.done = undefined; go.disabled = false; err.textContent = t("inqInvalid"); err.hidden = false; return; }
        save(); renderAll();
      }).catch(function () { item.done = "fail"; save(); renderAll(); });
    });
    card.appendChild(f);
    return card;
  }

  function showTyping() {
    var ty = el("div", "ta-typing"); ty.setAttribute("aria-label", "…");
    ty.append(el("span"), el("span"), el("span"));
    log.appendChild(ty); scrollDown();
    return ty;
  }
  function scrollDown() { log.scrollTop = log.scrollHeight; }

  function applyLang() {
    lText.textContent = t("launcher");
    launcher.setAttribute("aria-label", t("open"));
    closeBtn.setAttribute("aria-label", t("close"));
    restartBtn.setAttribute("aria-label", t("restart"));
    restartBtn.title = t("restart");
    title.textContent = t("title");
    sub.textContent = t("sub");
    input.placeholder = t("placeholder");
    input.setAttribute("aria-label", t("placeholder"));
    sendBtn.setAttribute("aria-label", t("send"));
    fine.textContent = t("fine");
    bEn.setAttribute("aria-pressed", String(state.lang === "en"));
    bEs.setAttribute("aria-pressed", String(state.lang === "es"));
    panel.lang = state.lang;
    renderAll();
  }

  /* ---------- Language ---------- */
  // The widget follows the site's EN/ES switch. Its own switch also flips the whole site.
  function setLang(lang, fromSite) {
    if (lang === state.lang) return;
    state.lang = lang; save(); applyLang();
    if (!fromSite) {
      var siteBtn = document.querySelector('.lang-btn[data-lang="' + lang + '"]');
      if (siteBtn && siteLang() !== lang) siteBtn.click();
    }
  }
  bEn.addEventListener("click", function () { state.langLocked = true; setLang("en"); });
  bEs.addEventListener("click", function () { state.langLocked = true; setLang("es"); });
  new MutationObserver(function () { setLang(siteLang(), true); }).observe(root, { attributes: true, attributeFilter: ["lang"] });

  function looksSpanish(s) {
    return /[¿¡ñ]|\b(hola|quiero|cuánto|cuanto|cuesta|corte|barba|mañana|puedo|reservar|horario|dónde|donde|precio|gracias|tienen|están|estan|hoy|cita|buenas|necesito)\b/i.test(s);
  }
  function looksEnglish(s) {
    return /\b(the|how|much|can|want|book|open|where|hi|hello|thanks|today|tomorrow|haircut|price|do you)\b/i.test(s);
  }

  /* ---------- Network ---------- */
  function post(path, body) {
    if (!API) return Promise.resolve({ ok: false, status: 503, json: function () { return Promise.resolve({}); } });
    var ctrl = window.AbortController ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 30000);
    return fetch(API + path, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body), signal: ctrl ? ctrl.signal : undefined, credentials: "omit"
    }).finally(function () { clearTimeout(timer); });
  }

  function apiHistory() {
    var out = [];
    state.items.forEach(function (i) {
      if (i.type === "msg" && (i.role === "user" || i.role === "bot")) out.push({ role: i.role === "user" ? "user" : "assistant", content: i.text });
      if (i.type === "booking") out.push({ role: "assistant", content: "[Booking card shown: " + [i.data.service, i.data.barber, i.data.date, i.data.time].filter(Boolean).join(", ") + "]" });
    });
    return out.slice(-20);
  }

  function sendMessage(text) {
    text = String(text || "").trim().slice(0, 600);
    if (!text || state.busy) return;
    if (!state.langLocked) {
      if (state.lang === "en" && looksSpanish(text) && !looksEnglish(text)) setLang("es", true);
      else if (state.lang === "es" && looksEnglish(text) && !looksSpanish(text)) setLang("en", true);
    }
    state.items.push({ type: "msg", role: "user", text: text });
    save(); renderAll();
    input.value = ""; autosize();
    state.busy = true; sendBtn.disabled = true;
    var typing = showTyping();
    var started = Date.now();

    post("/api/chat", { messages: apiHistory(), lang: state.lang }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (data) { return { r: r, data: data }; });
    }).then(function (res) {
      var wait = Math.max(0, 450 - (Date.now() - started)); // a short pause reads more natural
      setTimeout(function () {
        typing.remove();
        if (!res.r.ok) {
          var key = !API ? "errOff" : res.r.status === 429 || res.data.error === "daily_cap" ? "errBusy"
            : res.r.status === 503 ? "errOff" : "errNet";
          state.items.push({ type: "msg", role: "error", text: t(key) });
        } else {
          if (res.data.reply) state.items.push({ type: "msg", role: "bot", text: res.data.reply });
          if (res.data.booking) state.items.push({ type: "booking", data: res.data.booking });
          if (res.data.escalate) state.items.push({ type: "inquiry", prefill: text });
        }
        finish();
      }, wait);
    }).catch(function () {
      typing.remove();
      state.items.push({ type: "msg", role: "error", text: t(API ? "errNet" : "errOff") });
      finish();
    });
  }
  function finish() {
    state.busy = false; sendBtn.disabled = false;
    save(); renderAll();
    if (state.open && !matchMedia("(hover: none)").matches) input.focus();
  }

  /* ---------- Open / close ---------- */
  function openPanel() {
    state.open = true; wrap.classList.add("is-open"); launcher.classList.remove("is-new");
    launcher.setAttribute("aria-expanded", "true");
    renderAll();
    setTimeout(function () { input.focus({ preventScroll: true }); }, 60);
  }
  function closePanel() {
    state.open = false; wrap.classList.remove("is-open");
    launcher.setAttribute("aria-expanded", "false");
    launcher.focus({ preventScroll: true });
  }
  launcher.addEventListener("click", openPanel);
  closeBtn.addEventListener("click", closePanel);
  restartBtn.addEventListener("click", function () { state.items = []; save(); renderAll(); input.focus(); });
  panel.addEventListener("keydown", function (e) {
    if (e.key === "Escape") { e.stopPropagation(); closePanel(); }
  });

  /* ---------- Composer ---------- */
  function autosize() { input.style.height = "auto"; input.style.height = Math.min(input.scrollHeight, 120) + "px"; }
  input.addEventListener("input", autosize);
  input.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey && !e.isComposing) { e.preventDefault(); sendMessage(input.value); }
  });
  form.addEventListener("submit", function (e) { e.preventDefault(); sendMessage(input.value); });

  applyLang();
  window.TribeAssistant = { open: openPanel, close: closePanel };
})();
