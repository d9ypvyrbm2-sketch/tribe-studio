/* Tribe Receptionist: Brayan, the website's AI receptionist and booking assistant (front end).
   Vanilla JS, no libraries. Same robot and panel as tribe-assistant.js (so the page's robot greeting keeps working),
   plus guided booking: service -> barber -> first visit / returning -> date -> Booksy's official booking window
   opened INSIDE the chat (Booksy widget, inline mode). Booksy shows the real open times and confirms the booking.

   Setup: <script src="../assistant/tribe-receptionist.js" data-api="https://YOUR-PROJECT.vercel.app"
                  data-booksy-id="1023543" defer></script>
   No API keys live here. The browser only talks to the Vercel backend (chat + returning-customer memory).
   Without a backend the booking steps, the Booksy window and the quick answers still work; free-form chat and
   "remember me" need the backend. This file never says an appointment is booked: only Booksy confirms. */
(function () {
  "use strict";

  var script = document.currentScript;
  var API = ((script && script.getAttribute("data-api")) || window.TRIBE_ASSISTANT_API || "").replace(/\/+$/, "");
  // Local testing only: http://localhost:8080/preview-barbers/?api=http://localhost:8787 (ignored on the real site).
  if (!API && /^(localhost|127\.0\.0\.1)$/.test(location.hostname)) {
    API = (new URLSearchParams(location.search).get("api") || "").replace(/\/+$/, "");
  }
  var BOOKSY_ID = (script && script.getAttribute("data-booksy-id")) || "1023543";
  var BOOKSY_COUNTRY = (script && script.getAttribute("data-booksy-country")) || "us";
  var BOOKSY = "https://booksy.com/en-us/1023543_the-tribe-studio-1-maverick_barber-shop_22412_boston";
  var INSTAGRAM = "https://www.instagram.com/thetribestudiobarbershop/";
  var PHONE = "+18573349508", PHONE_LABEL = "(857) 334-9508";
  var STORE = "tribe-receptionist-v1";
  var TZ = "America/New_York";
  var root = document.documentElement;

  /* ---------- Shop facts (same as backend/lib/booking.js and knowledge.js) ---------- */
  var SERVICES = [
    { id: "Haircut", es: "Corte de cabello", price: "$40", andres: "$60" },
    { id: "Haircut & Beard", es: "Corte y barba", price: "$50", andres: "$70" },
    { id: "Line up", es: "Line up (perfilado)", price: "$25" },
    { id: "VIP", es: "VIP", price: "$70" },
    { id: "Hair color", es: "Color de cabello", price: "from $150", priceEs: "desde $150" }
  ];
  var BARBERS = ["Andres Ospina", "Keven", "Dumar Gomez", "Jean Carlos", "Kevin Tabares", "Santi Vélez", "Ricardo"];
  var ANY = "Any barber";
  // How each choice is named in Booksy's own menu (checked in the official widget, 2026-11-09).
  var BOOKSY_NAME = {
    "Haircut": { "Andres Ospina": "Haircut ANDRES", "Keven": "Haircut KEVEN", "Dumar Gomez": "Haircut DUMAR GOMEZ",
      "Jean Carlos": "Haircut JEAN CARLOS", "Kevin Tabares": "Haircut KEVIN TABARES", "Santi Vélez": "Haircut SANTI VÉLEZ",
      "Ricardo": "Haircut RICARDO" },
    "Haircut & Beard": { "Andres Ospina": "Haircut & Beard ANDRES", "Keven": "Haircut & Beard KEVEN",
      "Dumar Gomez": "Haircut & beard DUMAR GOMEZ", "Jean Carlos": "Haircut & Beard JEAN CARLOS",
      "Kevin Tabares": "Haircut & Beard KEVIN TABARES", "Santi Vélez": "Haircut & Beard SANTI VELEZ",
      "Ricardo": "Haircut & Beard RICARDO" }
  };
  // Opening hours (shop time zone), used for the date choices: [open hour, close hour] by weekday, 0 = Sunday.
  var HOURS = { 0: [10, 16], 1: [9, 20], 2: [9, 20], 3: [9, 20], 4: [9, 20], 5: [9, 20], 6: [9, 20] };

  var T = {
    en: {
      launcher: "Book with Brayan", open: "Open Brayan, the Tribe Studio receptionist", close: "Close the receptionist",
      title: "Brayan", sub: "Receptionist · online",
      welcome: "Hi, I'm Brayan, the receptionist at The Tribe Studio. Want to book a cut, or can I answer a question first?",
      placeholder: "Ask or say what you need…", send: "Send",
      startBook: "Book an appointment", startAgain: "Book again (been here before)", startPrices: "Prices", startHours: "Hours & location",
      steps: ["Service", "Barber", "You", "Date", "Time"], stepOf: "Step {n} of 5", edit: "Change",
      askService: "What can we do for you?",
      askBarber: "Do you have a favourite barber?",
      askCustomer: "Have you been to The Tribe Studio before?",
      firstTime: "First time", beenBefore: "I've been here before",
      askDate: "What day works for you?",
      otherDate: "Other date", pickDate: "Pick a date", today: "Today", tomorrow: "Tomorrow", go: "OK",
      review: "Here's what I have. Booksy will show the real open times for that day and confirm your appointment.",
      kicker: "Your booking so far", service: "Service", barber: "Barber", visit: "Visit", date: "Date",
      visitNew: "First visit", visitBack: "Returning client",
      seeTimes: "See open times", seeTimesNote: "Opens Booksy's official booking window right here. You stay on our site.",
      anyBarber: "Any barber", priceWith: "with Andres",
      lookupIntro: "Great. Type the phone number and first name you saved with me, and I'll pull up your usual.",
      phone: "Phone number", firstName: "First name", find: "Find me", skip: "Skip",
      found: "Welcome back, {name}! Last time you chose {svc}{bar}.", sameAgain: "Same again", somethingElse: "Something different",
      useUsual: "Switch to my usual", keepNew: "Keep this choice",
      notFound: "I couldn't find you with that number and name. No problem, let's keep going.",
      lookupOff: "I can't look up returning clients right now. No problem, let's keep going.",
      lookupInvalid: "Please check the phone number and first name.",
      busy: "Too many tries. Let's keep going without it.",
      booksyTitle: "Book on Booksy", backToChat: "Back to chat",
      guide1: "Tap “Book” next to {item}.", guide1Any: "Tap “Book” next to any “{svc}” row. Every barber's is {price}{andres}.",
      guide1Plain: "Tap “Book” next to “{item}”.",
      guideSearch: "Tip: type “{word}” in Booksy's search box.",
      guide2: "Pick {date} and an open time.", guide3: "Tap Continue. Booksy asks for your details and confirms.",
      guideBarber: "If Booksy asks for a barber, choose {barber}.",
      booksyLoading: "Opening Booksy…",
      booksyFail: "Booksy's window didn't load. You can open the Booksy page instead.", openBooksyPage: "Open Booksy",
      afterAsk: "Did Booksy confirm your appointment?",
      afterYes: "Yes, Booksy confirmed it", afterNo: "Not yet", afterHelp: "I need help",
      confirmed: "You're all set with Booksy. Booksy's confirmation (date, time, barber and service) is in its window and in the text or email it sends you. If anything is different from what we picked, Booksy's confirmation is the one that counts.",
      chosenKicker: "What you picked with me",
      notYet: "No problem. Tap “See open times” whenever you're ready.",
      helpText: "Tell me what's going on, or reach the shop directly:",
      rememberAsk: "Want me to remember your barber and service for next time?",
      rememberSave: "Remember me", rememberNo: "No thanks",
      rememberConsent: "Save my first name, phone number, barber and service so Brayan can welcome me back. I can ask Brayan to forget me anytime.",
      remembered: "Saved. Next time, tap “Book again” and I'll have your usual ready.",
      rememberOff: "I can't save that right now, but you're all set with Booksy.",
      rememberConsentErr: "Please tick the box first.",
      updateUsual: "Save {svc}{bar} as your usual?", yes: "Yes", no: "No",
      forgetLink: "Forget me", forgetIntro: "Type the phone number and first name you saved, and I'll delete them.",
      forgetBtn: "Delete my details", forgotten: "Done. If those details were saved, they're deleted now.",
      priceAnswer: "Haircut $40 ($60 with Andres) · Haircut & Beard $50 ($70 with Andres) · Line up $25 · VIP $70 · Hair color from $150. Booksy always shows the current price.",
      hoursAnswer: "We're at 55 Chelsea St, East Boston (2.2 miles from Logan Airport). Open Monday to Saturday 9 AM – 8 PM, Sunday 10 AM – 4 PM. Directions: https://www.google.com/maps/search/?api=1&query=55+Chelsea+St+East+Boston+MA+02128",
      offlineChat: "I can't chat freely right now, but the buttons will get you booked, and I can show prices and hours.",
      gotIt: "Got it.",
      fine: "AI receptionist · Booksy confirms every booking · don't share sensitive info",
      errNet: "I couldn't connect just now. The booking buttons still work.",
      errBusy: "I'm getting a lot of messages. The booking buttons still work.",
      retry: "Try again", call: "Call", instagram: "Message on Instagram",
      inqKicker: "Send your question to the shop",
      inqName: "Your name", inqContact: "Phone or email", inqMsg: "Your question",
      inqConsent: "I agree that The Tribe Studio may contact me about this question. My details are only used to reply.",
      inqSend: "Send to the shop", inqCancel: "Not now", inqOk: "Sent! The shop will get back to you.",
      inqFail: "That didn't go through. You can call the shop or message them on Instagram instead.",
      inqOff: "Messages to the shop aren't set up yet. You can call the shop or reach them on Instagram.",
      inqInvalid: "Please check your name, a valid phone or email, and your question.",
      inqConsentErr: "Please tick the box so the shop can reply to you.",
      newtab: "(opens in a new tab)", restart: "Start over", back: "Back"
    },
    es: {
      launcher: "Reserva con Brayan", open: "Abrir a Brayan, el recepcionista de Tribe Studio", close: "Cerrar el recepcionista",
      title: "Brayan", sub: "Recepcionista · en línea",
      welcome: "Hola, soy Brayan, el recepcionista de The Tribe Studio. ¿Quieres reservar un corte o te respondo una pregunta primero?",
      placeholder: "Pregunta o dime qué necesitas…", send: "Enviar",
      startBook: "Reservar una cita", startAgain: "Reservar otra vez (ya vine antes)", startPrices: "Precios", startHours: "Horario y ubicación",
      steps: ["Servicio", "Barbero", "Tú", "Fecha", "Hora"], stepOf: "Paso {n} de 5", edit: "Cambiar",
      askService: "¿Qué te hacemos hoy?",
      askBarber: "¿Tienes un barbero favorito?",
      askCustomer: "¿Ya has venido a The Tribe Studio?",
      firstTime: "Primera vez", beenBefore: "Ya he venido",
      askDate: "¿Qué día te queda bien?",
      otherDate: "Otra fecha", pickDate: "Elige una fecha", today: "Hoy", tomorrow: "Mañana", go: "OK",
      review: "Esto es lo que tengo. Booksy te mostrará las horas disponibles de ese día y confirmará tu cita.",
      kicker: "Tu reserva hasta ahora", service: "Servicio", barber: "Barbero", visit: "Visita", date: "Fecha",
      visitNew: "Primera visita", visitBack: "Cliente que regresa",
      seeTimes: "Ver horas disponibles", seeTimesNote: "Abre la ventana oficial de reservas de Booksy aquí mismo. No sales de nuestra página.",
      anyBarber: "Cualquier barbero", priceWith: "con Andres",
      lookupIntro: "Perfecto. Escribe el teléfono y el nombre que guardaste conmigo y busco lo de siempre.",
      phone: "Teléfono", firstName: "Nombre", find: "Buscarme", skip: "Omitir",
      found: "¡Qué bueno verte, {name}! La última vez elegiste {svc}{bar}.", sameAgain: "Lo mismo", somethingElse: "Algo diferente",
      useUsual: "Cambiar a lo de siempre", keepNew: "Dejar esta opción",
      notFound: "No te encontré con ese teléfono y nombre. No pasa nada, sigamos.",
      lookupOff: "Ahora no puedo buscar clientes. No pasa nada, sigamos.",
      lookupInvalid: "Revisa el teléfono y el nombre.",
      busy: "Demasiados intentos. Sigamos sin eso.",
      booksyTitle: "Reserva en Booksy", backToChat: "Volver al chat",
      guide1: "Toca “Agendar” junto a {item}.", guide1Any: "Toca “Agendar” junto a cualquier fila “{svc}”. Con cualquier barbero cuesta {price}{andres}.",
      guide1Plain: "Toca “Agendar” junto a “{item}”.",
      guideSearch: "Truco: escribe “{word}” en el buscador de Booksy.",
      guide2: "Elige {date} y una hora disponible.", guide3: "Toca el botón para continuar. Booksy te pide tus datos y confirma.",
      guideBarber: "Si Booksy pide un barbero, elige a {barber}.",
      booksyLoading: "Abriendo Booksy…",
      booksyFail: "La ventana de Booksy no cargó. Puedes abrir la página de Booksy.", openBooksyPage: "Abrir Booksy",
      afterAsk: "¿Booksy confirmó tu cita?",
      afterYes: "Sí, Booksy la confirmó", afterNo: "Todavía no", afterHelp: "Necesito ayuda",
      confirmed: "Listo con Booksy. La confirmación de Booksy (fecha, hora, barbero y servicio) está en su ventana y en el mensaje o correo que te envía. Si algo es distinto a lo que elegimos, vale la confirmación de Booksy.",
      chosenKicker: "Lo que elegiste conmigo",
      notYet: "No pasa nada. Toca “Ver horas disponibles” cuando quieras.",
      helpText: "Cuéntame qué pasa o contacta a la barbería:",
      rememberAsk: "¿Quieres que recuerde tu barbero y servicio para la próxima?",
      rememberSave: "Recuérdame", rememberNo: "No, gracias",
      rememberConsent: "Guardar mi nombre, teléfono, barbero y servicio para que Brayan me reconozca. Puedo pedirle a Brayan que me olvide cuando quiera.",
      remembered: "Guardado. La próxima vez toca “Reservar otra vez” y tendré lo de siempre listo.",
      rememberOff: "Ahora no puedo guardarlo, pero ya estás listo con Booksy.",
      rememberConsentErr: "Primero marca la casilla.",
      updateUsual: "¿Guardar {svc}{bar} como lo de siempre?", yes: "Sí", no: "No",
      forgetLink: "Olvídame", forgetIntro: "Escribe el teléfono y nombre que guardaste y los borro.",
      forgetBtn: "Borrar mis datos", forgotten: "Listo. Si esos datos estaban guardados, ya se borraron.",
      priceAnswer: "Corte $40 ($60 con Andres) · Corte y barba $50 ($70 con Andres) · Line up $25 · VIP $70 · Color desde $150. Booksy siempre muestra el precio actual.",
      hoursAnswer: "Estamos en 55 Chelsea St, East Boston (a 2.2 millas del aeropuerto Logan). Abrimos de lunes a sábado de 9 a. m. a 8 p. m. y el domingo de 10 a. m. a 4 p. m. Cómo llegar: https://www.google.com/maps/search/?api=1&query=55+Chelsea+St+East+Boston+MA+02128",
      offlineChat: "Ahora no puedo conversar libremente, pero los botones te llevan a reservar y te puedo mostrar precios y horario.",
      gotIt: "Perfecto.",
      fine: "Recepcionista con IA · Booksy confirma cada reserva · no compartas datos sensibles",
      errNet: "No pude conectarme ahora. Los botones de reserva siguen funcionando.",
      errBusy: "Estoy recibiendo muchos mensajes. Los botones de reserva siguen funcionando.",
      retry: "Intentar de nuevo", call: "Llamar", instagram: "Escribir por Instagram",
      inqKicker: "Envía tu pregunta a la barbería",
      inqName: "Tu nombre", inqContact: "Teléfono o correo", inqMsg: "Tu pregunta",
      inqConsent: "Acepto que The Tribe Studio me contacte sobre esta pregunta. Mis datos solo se usan para responder.",
      inqSend: "Enviar a la barbería", inqCancel: "Ahora no", inqOk: "¡Enviado! La barbería te responderá.",
      inqFail: "No se pudo enviar. Puedes llamar a la barbería o escribirles por Instagram.",
      inqOff: "Los mensajes a la barbería aún no están configurados. Puedes llamar o escribirles por Instagram.",
      inqInvalid: "Revisa tu nombre, un teléfono o correo válido y tu pregunta.",
      inqConsentErr: "Marca la casilla para que la barbería pueda responderte.",
      newtab: "(se abre en una pestaña nueva)", restart: "Empezar de nuevo", back: "Atrás"
    }
  };

  /* ---------- State ---------- */
  // items: chat log. bk: booking choices. step: which step card shows at the end of the log.
  // The phone number is kept in memory only (never in browser storage).
  var state = { lang: siteLang(), items: [], bk: {}, step: "start", open: false, busy: false, langLocked: false,
    me: null, remembered: false };
  var phoneMem = "";
  try {
    var saved = JSON.parse(sessionStorage.getItem(STORE) || "null");
    if (saved && Array.isArray(saved.items)) {
      state.items = saved.items; state.bk = saved.bk || {}; state.step = saved.step || "start";
      state.lang = saved.lang || state.lang; state.me = saved.me || null; state.remembered = !!saved.remembered;
      if (state.step === "booksy") state.step = "after"; // a reload closes the Booksy window
    }
  } catch (e) { /* storage blocked: start fresh */ }

  function save() {
    try {
      sessionStorage.setItem(STORE, JSON.stringify({ items: state.items.slice(-60), bk: state.bk, step: state.step,
        lang: state.lang, me: state.me, remembered: state.remembered }));
    } catch (e) { /* ignore */ }
  }
  function siteLang() { return (root.getAttribute("lang") || "en").toLowerCase().indexOf("es") === 0 ? "es" : "en"; }
  function t(k, vars) {
    var s = (T[state.lang] && T[state.lang][k]) || T.en[k];
    if (vars) Object.keys(vars).forEach(function (v) { s = s.split("{" + v + "}").join(vars[v]); });
    return s;
  }
  function svcInfo(id) { for (var i = 0; i < SERVICES.length; i++) if (SERVICES[i].id === id) return SERVICES[i]; return null; }
  function svcName(id) { var s = svcInfo(id); return s ? (state.lang === "es" ? s.es : s.id) : id; }
  function barberName(b) { return b === ANY ? t("anyBarber") : b; }
  function priceFor(service, barber) {
    var s = svcInfo(service); if (!s) return "";
    if (barber === "Andres Ospina" && s.andres) return s.andres;
    return state.lang === "es" && s.priceEs ? s.priceEs : s.price;
  }

  /* ---------- Dates (shop time zone) ---------- */
  function shopParts(d) {
    var f = new Intl.DateTimeFormat("en-US", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hour12: false, weekday: "short" });
    var p = {}; f.formatToParts(d).forEach(function (x) { p[x.type] = x.value; });
    return { ymd: p.year + "-" + p.month + "-" + p.day, hour: Number(p.hour) % 24,
      dow: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(p.weekday) };
  }
  function addDays(ymd, n) {
    var d = new Date(ymd + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + n);
    return d.toISOString().slice(0, 10);
  }
  function dowOf(ymd) { return new Date(ymd + "T12:00:00Z").getUTCDay(); }
  function dateLabel(ymd, short) {
    var now = shopParts(new Date()).ymd;
    if (ymd === now) return t("today");
    if (ymd === addDays(now, 1)) return t("tomorrow");
    return new Intl.DateTimeFormat(state.lang === "es" ? "es-US" : "en-US",
      { timeZone: "UTC", weekday: short ? "short" : "long", month: short ? "short" : "long", day: "numeric" })
      .format(new Date(ymd + "T12:00:00Z"));
  }
  function dateChoices() {
    var now = shopParts(new Date()), out = [], d = now.ymd;
    // Skip today when there's less than an hour left before closing.
    if (now.hour >= HOURS[now.dow][1] - 1) d = addDays(d, 1);
    for (var i = 0; out.length < 7 && i < 10; i++) { out.push(d); d = addDays(d, 1); }
    return out;
  }

  /* ---------- DOM helpers ---------- */
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function btn(cls, text, onClick) {
    var b = el("button", cls, text); b.type = "button";
    if (onClick) b.addEventListener("click", onClick);
    return b;
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

  /* ---------- Shell: robot launcher + panel (same structure and classes as tribe-assistant.js) ---------- */
  var wrap = el("div"); wrap.id = "tribe-assistant"; wrap.className = "ta-receptionist";
  var launcher = el("button", "ta-launcher"); launcher.type = "button";
  launcher.setAttribute("aria-haspopup", "dialog"); launcher.setAttribute("aria-expanded", "false");
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
  lBot.innerHTML = BOT_SVG; // static markup, no user data
  var lText = el("span", "ta-launcher-text");
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
  var bEn = btn("ta-lang", "EN"); bEn.lang = "en";
  var bEs = btn("ta-lang", "ES"); bEs.lang = "es";
  langs.append(bEn, bEs);
  var restartBtn = btn("ta-icon-btn"); restartBtn.appendChild(svg("M4 4v6h6M20 20v-6h-6M5.5 15a7 7 0 0 0 12.3 2.3M18.5 9A7 7 0 0 0 6.2 6.7"));
  var closeBtn = btn("ta-icon-btn"); closeBtn.appendChild(svg("M6 6l12 12M18 6 6 18"));
  head.append(hMark, hText, langs, restartBtn, closeBtn);

  // Booking progress: five steps; finished steps are buttons that take you back to change them.
  var progress = el("nav", "tr-progress");
  var log = el("div", "ta-log");
  log.setAttribute("role", "log"); log.setAttribute("aria-live", "polite"); log.setAttribute("aria-relevant", "additions");
  var form = el("form", "ta-compose");
  var input = el("textarea", "ta-input"); input.rows = 1; input.maxLength = 600; input.setAttribute("enterkeyhint", "send");
  var sendBtn = el("button", "ta-send"); sendBtn.type = "submit";
  sendBtn.appendChild(svg("M5 12h14M13 6l6 6-6 6"));
  form.append(input, sendBtn);
  var fine = el("p", "ta-fine");
  var fineText = el("span");
  var forgetBtn = btn("tr-linkbtn", "", function () { showForget(); });
  fine.append(fineText, document.createTextNode(" · "), forgetBtn);

  // Booksy sheet: covers the chat while Booksy's own booking window is open.
  var sheet = el("div", "tr-sheet"); sheet.hidden = true;
  var sheetHead = el("div", "tr-sheet-head");
  var sheetBack = btn("tr-sheet-back", null, function () { closeBooksy(); });
  var sheetBackText = el("span");
  sheetBack.append(svg("M15 6l-6 6 6 6"), sheetBackText);
  var sheetTitle = el("p", "tr-sheet-title");
  sheetHead.append(sheetBack, sheetTitle);
  var guide = el("ol", "tr-guide");
  var booksyBox = el("div", "tr-booksy");
  sheet.append(sheetHead, guide, booksyBox);

  panel.append(head, progress, log, form, fine, sheet);
  wrap.append(launcher, panel);
  document.body.appendChild(wrap);

  /* ---------- Rendering ---------- */
  var SAFE_LINK = /(https:\/\/(?:booksy\.com|www\.google\.com\/maps|maps\.google\.com|www\.instagram\.com)\/[^\s)]+)/g;
  function textWithLinks(node, text) {
    String(text).split(SAFE_LINK).forEach(function (part, i) {
      if (i % 2 === 1) {
        var a = el("a", null, part.indexOf("booksy.com") > -1 ? "Booksy" : part.indexOf("instagram.com") > -1 ? "Instagram" : "Google Maps");
        a.href = part; a.target = "_blank"; a.rel = "noopener noreferrer";
        node.appendChild(a);
      } else if (part) node.appendChild(document.createTextNode(part));
    });
  }
  function say(text) { state.items.push({ type: "msg", role: "bot", text: text }); }
  function sayKey(key, vars) { state.items.push({ type: "msg", role: "bot", key: key, vars: vars || null }); }
  function msgText(item) { return item.key ? t(item.key, item.vars) : item.text; }

  function renderItem(item) {
    if (item.type === "msg") {
      var m = el("div", "ta-msg " + (item.role === "user" ? "ta-user" : item.role === "error" ? "ta-error" : "ta-bot"));
      if (item.role === "user") m.textContent = item.text; else textWithLinks(m, msgText(item));
      log.appendChild(m);
    } else if (item.type === "chosen") {
      log.appendChild(summaryCard(item.bk, t("chosenKicker")));
    } else if (item.type === "inquiry") {
      log.appendChild(inquiryCard(item));
    }
  }

  function renderAll() {
    log.textContent = "";
    log.appendChild(el("div", "ta-msg ta-bot", t("welcome")));
    state.items.forEach(renderItem);
    var card = stepCard();
    if (card) log.appendChild(card);
    renderProgress();
    scrollDown();
  }
  function scrollDown() { log.scrollTop = log.scrollHeight; }

  var STEP_INDEX = { service: 0, barber: 1, customer: 2, lookup: 2, found: 2, date: 3, review: 4, booksy: 4, after: 4 };
  function renderProgress() {
    progress.textContent = "";
    var idx = STEP_INDEX[state.step];
    progress.hidden = idx == null;
    if (idx == null) return;
    progress.setAttribute("aria-label", t("stepOf", { n: idx + 1 }));
    var ol = el("ol");
    var keys = ["service", "barber", "customer", "date", "review"];
    t("steps").forEach(function (name, i) {
      var li = el("li", i < idx ? "is-done" : i === idx ? "is-current" : "");
      var done = i < idx && (i < 4);
      var node = done ? btn("tr-step", null, function () { goStep(keys[i]); }) : el("span", "tr-step");
      node.appendChild(el("span", "tr-step-dot", String(i + 1)));
      node.appendChild(el("span", "tr-step-name", name));
      if (done) node.setAttribute("aria-label", t("edit") + ": " + name);
      if (i === idx) node.setAttribute("aria-current", "step");
      li.appendChild(node); ol.appendChild(li);
    });
    progress.appendChild(ol);
  }

  function chips(list) {
    var row = el("div", "tr-choices");
    list.forEach(function (c) {
      var b = btn("ta-chip tr-chip" + (c.primary ? " is-primary" : "") + (c.selected ? " is-selected" : ""), null, c.onClick);
      b.appendChild(el("span", "tr-chip-label", c.label));
      if (c.meta) b.appendChild(el("span", "tr-chip-meta", c.meta));
      if (c.selected) b.setAttribute("aria-pressed", "true");
      row.appendChild(b);
    });
    return row;
  }

  function stepCard() {
    var bk = state.bk;
    if (state.step === "start") {
      return chips([
        { label: t("startBook"), primary: true, onClick: function () { userSays(t("startBook")); goStep("service"); } },
        { label: t("startAgain"), onClick: function () { userSays(t("startAgain")); bk.customer = "returning"; goStep("lookup"); } },
        { label: t("startPrices"), onClick: function () { userSays(t("startPrices")); sayKey("priceAnswer"); render(); } },
        { label: t("startHours"), onClick: function () { userSays(t("startHours")); sayKey("hoursAnswer"); render(); } }
      ]);
    }
    if (state.step === "service") {
      return chips(SERVICES.map(function (s) {
        return { label: svcName(s.id), meta: (state.lang === "es" && s.priceEs ? s.priceEs : s.price) + (s.andres ? " · " + s.andres + " " + t("priceWith") : ""),
          selected: bk.service === s.id,
          onClick: function () { userSays(svcName(s.id)); bk.service = s.id; advance(); } };
      }));
    }
    if (state.step === "barber") {
      var list = [{ label: t("anyBarber"), selected: bk.barber === ANY, onClick: function () { userSays(t("anyBarber")); bk.barber = ANY; advance(); } }];
      BARBERS.forEach(function (b) {
        list.push({ label: b, meta: bk.service ? priceFor(bk.service, b) : "", selected: bk.barber === b,
          onClick: function () { userSays(b); bk.barber = b; advance(); } });
      });
      return chips(list);
    }
    if (state.step === "customer") {
      return chips([
        { label: t("firstTime"), selected: bk.customer === "new", onClick: function () { userSays(t("firstTime")); bk.customer = "new"; advance(); } },
        { label: t("beenBefore"), selected: bk.customer === "returning", onClick: function () { userSays(t("beenBefore")); bk.customer = "returning"; goStep("lookup"); } }
      ]);
    }
    if (state.step === "lookup") return lookupCard();
    if (state.step === "found") return foundCard();
    if (state.step === "date") return dateCard();
    if (state.step === "review") return reviewCard();
    if (state.step === "after") {
      return chips([
        { label: t("afterYes"), primary: true, onClick: function () { userSays(t("afterYes")); confirmedByCustomer(); } },
        { label: t("afterNo"), onClick: function () { userSays(t("afterNo")); sayKey("notYet"); state.step = "review"; render(); } },
        { label: t("afterHelp"), onClick: function () { userSays(t("afterHelp")); sayKey("helpText"); state.items.push({ type: "inquiry", prefill: "" }); state.step = "review"; render(); } }
      ]);
    }
    if (state.step === "remember") return rememberCard();
    if (state.step === "usual") {
      return chips([
        { label: t("yes"), primary: true, onClick: function () { userSays(t("yes")); saveCustomer(state.me.firstName, phoneMem); } },
        { label: t("no"), onClick: function () { userSays(t("no")); state.step = "done"; render(); } }
      ]);
    }
    if (state.step === "forget") return forgetCard();
    return null;
  }

  function summaryCard(bk, kicker) {
    var card = el("div", "ta-card tr-summary");
    card.appendChild(el("p", "ta-card-kicker", kicker));
    var dl = el("dl");
    function row(label, value, step) {
      if (!value) return;
      var dd = el("dd", null, value);
      if (step && kicker === t("kicker")) {
        var e = btn("tr-edit", t("edit"), function () { goStep(step); });
        e.setAttribute("aria-label", t("edit") + " " + label.toLowerCase());
        dd.appendChild(e);
      }
      dl.append(el("dt", null, label), dd);
    }
    row(t("service"), bk.service ? svcName(bk.service) + " · " + priceFor(bk.service, bk.barber) : "", "service");
    row(t("barber"), bk.barber ? barberName(bk.barber) : "", "barber");
    row(t("visit"), bk.customer ? (bk.customer === "new" ? t("visitNew") : t("visitBack")) : "", "customer");
    row(t("date"), bk.date ? dateLabel(bk.date) : "", "date");
    card.appendChild(dl);
    return card;
  }

  function reviewCard() {
    var wrapC = el("div", "tr-review");
    wrapC.appendChild(summaryCard(state.bk, t("kicker")));
    var go = btn("ta-btn ta-btn-gold tr-cta", t("seeTimes"), function () { openBooksy(); });
    wrapC.appendChild(go);
    wrapC.appendChild(el("p", "ta-card-note", t("seeTimesNote")));
    return wrapC;
  }

  function dateCard() {
    var c = el("div", "tr-datecard");
    c.appendChild(chips(dateChoices().map(function (d) {
      return { label: dateLabel(d, true), selected: state.bk.date === d,
        onClick: function () { userSays(dateLabel(d)); state.bk.date = d; advance(); } };
    })));
    var other = el("form", "tr-otherdate");
    var lab = el("label", null, t("otherDate"));
    var inp = el("input"); inp.type = "date";
    var today = shopParts(new Date()).ymd;
    inp.min = today; inp.max = addDays(today, 90);
    lab.appendChild(inp);
    var ok = el("button", "ta-btn ta-btn-ghost", t("go")); ok.type = "submit";
    other.append(lab, ok);
    other.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!/^\d{4}-\d{2}-\d{2}$/.test(inp.value) || inp.value < today) { inp.focus(); return; }
      userSays(dateLabel(inp.value)); state.bk.date = inp.value; advance();
    });
    c.appendChild(other);
    return c;
  }

  function field(f, label, name, attrs) {
    var l = el("label", null, label);
    var i = el("input"); i.name = name;
    Object.keys(attrs || {}).forEach(function (k) { i.setAttribute(k, attrs[k]); });
    l.appendChild(i); f.appendChild(l); return i;
  }

  function lookupCard() {
    var card = el("div", "ta-card");
    var f = el("form", "ta-form"); f.noValidate = true;
    var phone = field(f, t("phone"), "tel", { type: "tel", autocomplete: "tel", inputmode: "tel", maxlength: "20" });
    var name = field(f, t("firstName"), "given-name", { autocomplete: "given-name", maxlength: "40" });
    var err = el("p", "ta-form-err"); err.hidden = true; err.setAttribute("role", "alert"); f.appendChild(err);
    var row = el("div", "ta-row");
    var go = el("button", "ta-btn ta-btn-gold", t("find")); go.type = "submit";
    var no = btn("ta-btn ta-btn-ghost", t("skip"), function () { userSays(t("skip")); advance(); });
    row.append(go, no); f.appendChild(row);
    f.addEventListener("submit", function (e) {
      e.preventDefault(); err.hidden = true;
      if (phone.value.replace(/\D/g, "").length < 8 || name.value.trim().length < 2) { err.textContent = t("lookupInvalid"); err.hidden = false; return; }
      go.disabled = true;
      var p = phone.value, n = name.value.trim();
      post("/api/customer", { action: "lookup", phone: p, firstName: n }).then(readJson).then(function (res) {
        if (res.r.ok && res.data.found) {
          phoneMem = p;
          state.me = { firstName: res.data.firstName, service: res.data.service, barber: res.data.barber };
          sayKey("found", { name: res.data.firstName, svc: res.data.service ? svcName(res.data.service) : "",
            bar: res.data.barber ? " · " + barberName(res.data.barber) : "" });
          if (res.data.service) { state.step = "found"; render(); } else advance();
        } else if (res.r.ok) { sayKey("notFound"); advance(); }
        else if (res.r.status === 400) { go.disabled = false; err.textContent = t("lookupInvalid"); err.hidden = false; }
        else { sayKey(res.r.status === 429 ? "busy" : "lookupOff"); advance(); }
      }).catch(function () { sayKey("lookupOff"); advance(); });
    });
    card.appendChild(f);
    setTimeout(function () { if (state.open) phone.focus({ preventScroll: true }); }, 50);
    return card;
  }

  // A returning client was found: offer "same again" (fewest questions) or keep going.
  function foundCard() {
    var me = state.me, bk = state.bk;
    var differs = bk.service && (bk.service !== me.service || (me.barber && bk.barber && bk.barber !== me.barber));
    if (differs) {
      return chips([
        { label: t("useUsual"), primary: true, onClick: function () { userSays(t("useUsual")); bk.service = me.service; if (me.barber) bk.barber = me.barber; advance(); } },
        { label: t("keepNew"), onClick: function () { userSays(t("keepNew")); advance(); } }
      ]);
    }
    return chips([
      { label: t("sameAgain"), primary: true, onClick: function () { userSays(t("sameAgain")); bk.service = me.service; bk.barber = me.barber || bk.barber; advance(); } },
      { label: t("somethingElse"), onClick: function () { userSays(t("somethingElse")); delete bk.service; delete bk.barber; advance(); } }
    ]);
  }

  function rememberCard() {
    var card = el("div", "ta-card");
    var f = el("form", "ta-form"); f.noValidate = true;
    var name = field(f, t("firstName"), "given-name", { autocomplete: "given-name", maxlength: "40" });
    var phone = field(f, t("phone"), "tel", { type: "tel", autocomplete: "tel", inputmode: "tel", maxlength: "20" });
    var chk = el("label", "ta-check"); var cb = el("input"); cb.type = "checkbox";
    chk.append(cb, el("span", null, t("rememberConsent"))); f.appendChild(chk);
    var err = el("p", "ta-form-err"); err.hidden = true; err.setAttribute("role", "alert"); f.appendChild(err);
    var row = el("div", "ta-row");
    var go = el("button", "ta-btn ta-btn-gold", t("rememberSave")); go.type = "submit";
    var no = btn("ta-btn ta-btn-ghost", t("rememberNo"), function () { userSays(t("rememberNo")); state.step = "done"; render(); });
    row.append(go, no); f.appendChild(row);
    f.addEventListener("submit", function (e) {
      e.preventDefault(); err.hidden = true;
      if (!cb.checked) { err.textContent = t("rememberConsentErr"); err.hidden = false; return; }
      if (phone.value.replace(/\D/g, "").length < 8 || name.value.trim().length < 2) { err.textContent = t("lookupInvalid"); err.hidden = false; return; }
      go.disabled = true;
      saveCustomer(name.value.trim(), phone.value);
    });
    card.appendChild(f);
    return card;
  }

  function saveCustomer(firstName, phone) {
    var bk = state.bk;
    post("/api/customer", { action: "save", phone: phone, firstName: firstName, service: bk.service,
      barber: bk.barber, lang: state.lang, consent: true }).then(function (r) {
      if (r.ok) { state.remembered = true; state.me = { firstName: firstName, service: bk.service, barber: bk.barber }; sayKey("remembered"); }
      else sayKey("rememberOff");
      state.step = "done"; render();
    }).catch(function () { sayKey("rememberOff"); state.step = "done"; render(); });
  }

  function showForget() {
    if (!state.open) openPanel();
    userSays(t("forgetLink"));
    sayKey("forgetIntro");
    state.prevStep = state.step === "forget" ? state.prevStep : state.step;
    state.step = "forget"; render();
  }
  function forgetCard() {
    var card = el("div", "ta-card");
    var f = el("form", "ta-form"); f.noValidate = true;
    var phone = field(f, t("phone"), "tel", { type: "tel", autocomplete: "tel", inputmode: "tel", maxlength: "20" });
    var name = field(f, t("firstName"), "given-name", { autocomplete: "given-name", maxlength: "40" });
    var err = el("p", "ta-form-err"); err.hidden = true; err.setAttribute("role", "alert"); f.appendChild(err);
    var row = el("div", "ta-row");
    var go = el("button", "ta-btn ta-btn-gold", t("forgetBtn")); go.type = "submit";
    var no = btn("ta-btn ta-btn-ghost", t("back"), function () { state.step = state.prevStep || "start"; render(); });
    row.append(go, no); f.appendChild(row);
    f.addEventListener("submit", function (e) {
      e.preventDefault(); err.hidden = true;
      if (phone.value.replace(/\D/g, "").length < 8 || name.value.trim().length < 2) { err.textContent = t("lookupInvalid"); err.hidden = false; return; }
      go.disabled = true;
      post("/api/customer", { action: "forget", phone: phone.value, firstName: name.value.trim() }).then(function (r) {
        sayKey(r.ok ? "forgotten" : "lookupOff");
        if (r.ok) { state.me = null; state.remembered = false; phoneMem = ""; }
        state.step = state.prevStep || "start"; render();
      }).catch(function () { sayKey("lookupOff"); state.step = state.prevStep || "start"; render(); });
    });
    card.appendChild(f);
    return card;
  }

  function inquiryCard(item) {
    var card = el("div", "ta-card");
    card.appendChild(el("p", "ta-card-kicker", t("inqKicker")));
    if (item.done) {
      card.appendChild(el("p", null, item.done === "ok" ? t("inqOk") : item.done === "off" ? t("inqOff") : t("inqFail")));
      if (item.done !== "ok") card.appendChild(contactRow());
      return card;
    }
    var f = el("form", "ta-form"); f.noValidate = true;
    var name = field(f, t("inqName"), "name", { autocomplete: "name", maxlength: "80" });
    var contact = field(f, t("inqContact"), "contact", { autocomplete: "email", inputmode: "email", maxlength: "120" });
    var ml = el("label", null, t("inqMsg")); var msg = el("textarea"); msg.maxLength = 1200; msg.value = item.prefill || "";
    ml.appendChild(msg); f.appendChild(ml);
    var hp = el("label", "ta-hp"); hp.setAttribute("aria-hidden", "true");
    var hpIn = el("input"); hpIn.name = "website"; hpIn.tabIndex = -1; hpIn.autocomplete = "off"; hp.appendChild(hpIn); f.appendChild(hp);
    var chk = el("label", "ta-check"); var cb = el("input"); cb.type = "checkbox";
    chk.append(cb, el("span", null, t("inqConsent"))); f.appendChild(chk);
    var err = el("p", "ta-form-err"); err.hidden = true; err.setAttribute("role", "alert"); f.appendChild(err);
    var row = el("div", "ta-row");
    var go = el("button", "ta-btn ta-btn-gold", t("inqSend")); go.type = "submit";
    var no = btn("ta-btn ta-btn-ghost", t("inqCancel"), function () { state.items.splice(state.items.indexOf(item), 1); render(); });
    row.append(go, no); f.appendChild(row);
    f.addEventListener("submit", function (e) {
      e.preventDefault(); err.hidden = true;
      if (!cb.checked) { err.textContent = t("inqConsentErr"); err.hidden = false; return; }
      var c = contact.value.trim();
      var valid = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(c) || /^\+?[\d\s().-]{7,20}$/.test(c);
      if (name.value.trim().length < 2 || !valid || msg.value.trim().length < 5) { err.textContent = t("inqInvalid"); err.hidden = false; return; }
      go.disabled = true;
      post("/api/inquiry", { name: name.value, contact: c, message: msg.value, lang: state.lang, consent: true, website: hpIn.value })
        .then(function (r) { item.done = r.ok ? "ok" : r.status === 503 ? "off" : "fail"; render(); })
        .catch(function () { item.done = "fail"; render(); });
    });
    card.appendChild(f);
    card.appendChild(contactRow());
    return card;
  }
  function contactRow() {
    var acts = el("div", "ta-row"); acts.style.marginTop = "10px";
    var call = el("a", "ta-btn ta-btn-gold", t("call") + " " + PHONE_LABEL); call.href = "tel:" + PHONE;
    var ig = el("a", "ta-btn ta-btn-ghost", "Instagram");
    ig.href = INSTAGRAM; ig.target = "_blank"; ig.rel = "noopener noreferrer";
    ig.setAttribute("aria-label", t("instagram") + " " + t("newtab"));
    acts.append(call, ig);
    return acts;
  }

  /* ---------- Flow ---------- */
  function nextStep() {
    var bk = state.bk;
    if (!bk.service) return "service";
    if (!bk.barber) return "barber";
    if (!bk.customer) return "customer";
    if (!bk.date) return "date";
    return "review";
  }
  var ASK = { service: "askService", barber: "askBarber", customer: "askCustomer", date: "askDate", review: "review" };
  function goStep(step) {
    state.step = step;
    if (ASK[step]) sayKey(ASK[step]);
    if (step === "lookup") sayKey("lookupIntro");
    render();
  }
  function advance() { goStep(nextStep()); }
  function userSays(text) { state.items.push({ type: "msg", role: "user", text: text }); }
  function render() { save(); renderAll(); }

  function confirmedByCustomer() {
    sayKey("confirmed");
    state.items.push({ type: "chosen", bk: JSON.parse(JSON.stringify(state.bk)) });
    var bk = state.bk;
    if (state.me && phoneMem && (state.me.service !== bk.service || state.me.barber !== bk.barber)) {
      sayKey("updateUsual", { svc: svcName(bk.service), bar: bk.barber && bk.barber !== ANY ? " · " + bk.barber : "" });
      state.step = "usual";
    } else if (state.me || state.remembered) {
      state.step = "done";
    } else {
      sayKey("rememberAsk"); state.step = "remember";
    }
    render();
  }

  /* ---------- Booksy's official widget, inline inside the chat ---------- */
  var booksyCount = 0, booksyWatch = null, booksyTimer = null;
  function booksyItem(bk) {
    var names = BOOKSY_NAME[bk.service];
    if (names && bk.barber && names[bk.barber]) {
      return { text: t("guide1", { item: "“" + names[bk.barber] + "”" }), search: bk.barber.split(" ")[0] };
    }
    if (names) {
      var s = svcInfo(bk.service);
      return { text: t("guide1Any", { svc: bk.service, price: s.price, andres: s.andres ? " (" + s.andres + " " + t("priceWith") + ")" : "" }) };
    }
    return { text: t("guide1Plain", { item: bk.service }), barber: bk.barber && bk.barber !== ANY ? bk.barber : "" };
  }
  function openBooksy() {
    var bk = state.bk;
    state.step = "booksy"; save();
    wrap.classList.add("is-booking");
    sheetTitle.textContent = t("booksyTitle");
    sheetBackText.textContent = t("backToChat");
    guide.textContent = "";
    var item = booksyItem(bk);
    guide.appendChild(el("li", null, item.text));
    if (item.barber) guide.appendChild(el("li", null, t("guideBarber", { barber: item.barber })));
    if (item.search) guide.firstChild.appendChild(el("span", "tr-guide-tip", " " + t("guideSearch", { word: item.search })));
    var when = bk.date ? dateLabel(bk.date) : "";
    if (state.lang === "es" && /^(Hoy|Mañana)$/.test(when)) when = when.toLowerCase();
    guide.appendChild(el("li", null, t("guide2", { date: when })));
    guide.appendChild(el("li", null, t("guide3")));
    booksyBox.textContent = "";
    var loading = el("p", "tr-booksy-loading", t("booksyLoading"));
    booksyBox.appendChild(loading);
    // The official Booksy widget script, in inline mode: it puts Booksy's booking page (an iframe) right where the
    // script tag is. The extra n= keeps each opening unique, because the script refuses to run the same src twice.
    var s = document.createElement("script");
    s.src = "https://booksy.com/widget/code.js?id=" + encodeURIComponent(BOOKSY_ID) + "&country=" + BOOKSY_COUNTRY +
      "&lang=" + (state.lang === "es" ? "es" : "en") + "&mode=inline&n=" + (++booksyCount);
    s.async = true;
    s.onerror = booksyFailed;
    booksyBox.appendChild(s);
    sheet.hidden = false;
    renderProgress();
    // Booksy's widget removes its own container when the customer closes it inside Booksy: treat that as "back".
    if (booksyWatch) booksyWatch.disconnect();
    booksyWatch = new MutationObserver(function () {
      var frame = booksyBox.querySelector("iframe");
      if (frame && loading.parentNode) { loading.remove(); clearTimeout(booksyTimer); }
      if (booksyBox.dataset.seen && !booksyBox.querySelector(".booksy-widget-container")) closeBooksy();
      if (booksyBox.querySelector(".booksy-widget-container")) booksyBox.dataset.seen = "1";
    });
    booksyWatch.observe(booksyBox, { childList: true, subtree: true });
    clearTimeout(booksyTimer);
    booksyTimer = setTimeout(function () { if (!booksyBox.querySelector("iframe")) booksyFailed(); }, 12000);
    setTimeout(function () { sheetBack.focus({ preventScroll: true }); }, 60);
  }
  function booksyFailed() {
    booksyBox.textContent = "";
    var p = el("p", "tr-booksy-loading", t("booksyFail"));
    var a = el("a", "ta-btn ta-btn-gold", t("openBooksyPage"));
    a.href = BOOKSY; a.target = "_blank"; a.rel = "noopener noreferrer";
    a.setAttribute("aria-label", t("openBooksyPage") + " " + t("newtab"));
    booksyBox.append(p, a);
  }
  function closeBooksy() {
    if (sheet.hidden) return;
    if (booksyWatch) { booksyWatch.disconnect(); booksyWatch = null; }
    clearTimeout(booksyTimer);
    sheet.hidden = true;
    booksyBox.textContent = ""; delete booksyBox.dataset.seen;
    wrap.classList.remove("is-booking");
    sayKey("afterAsk");
    state.step = "after";
    render();
    input.focus({ preventScroll: true });
  }

  /* ---------- Free-form chat ---------- */
  function looksSpanish(s) {
    return /[¿¡ñ]|\b(hola|quiero|cuánto|cuanto|cuesta|corte|barba|mañana|puedo|reservar|horario|dónde|donde|precio|gracias|tienen|están|estan|hoy|cita|buenas|necesito)\b/i.test(s);
  }
  function looksEnglish(s) {
    return /\b(the|how|much|can|want|book|open|where|hi|hello|thanks|today|tomorrow|haircut|price|do you)\b/i.test(s);
  }

  // Quick understanding without the AI (works offline): fills steps from obvious words, answers prices and hours.
  function localUnderstand(text) {
    var s = text.toLowerCase(), u = {};
    if (/line ?up|perfilado/.test(s)) u.service = "Line up";
    else if (/beard|barba/.test(s)) u.service = "Haircut & Beard";
    else if (/\b(fade|haircut|taper|cut|corte)\b/.test(s)) u.service = "Haircut";
    else if (/\bcolou?r\b|\btinte\b/.test(s)) u.service = "Hair color";
    else if (/\bvip\b/.test(s)) u.service = "VIP";
    var b = /jean ?carlos/.test(s) ? "Jean Carlos" : /andres/.test(s) ? "Andres Ospina" : /keven/.test(s) ? "Keven"
      : /dumar/.test(s) ? "Dumar Gomez" : /tabares|kevin t/.test(s) ? "Kevin Tabares" : /santi/.test(s) ? "Santi Vélez"
      : /ricardo|\brick\b/.test(s) ? "Ricardo" : "";
    if (b) u.barber = b;
    var today = shopParts(new Date()).ymd;
    if (/tomorrow|mañana/.test(s)) u.date = addDays(today, 1);
    else if (/\btoday\b|\bhoy\b/.test(s)) u.date = today;
    var faq = /hour|open|horario|abren|abierto|where|address|dónde|donde|ubicad|direcci|airport|aeropuerto/.test(s) ? "hoursAnswer"
      : /price|how much|cuánto|cuanto|precio|cost/.test(s) ? "priceAnswer" : "";
    return { update: u, faq: faq };
  }

  function applyUpdate(u) {
    var changed = false;
    ["service", "barber", "date"].forEach(function (k) { if (u[k] && state.bk[k] !== u[k]) { state.bk[k] = u[k]; changed = true; } });
    return changed;
  }

  function readJson(r) { return r.json().catch(function () { return {}; }).then(function (data) { return { r: r, data: data }; }); }
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
      if (i.type === "msg" && (i.role === "user" || i.role === "bot")) out.push({ role: i.role === "user" ? "user" : "assistant", content: msgText(i) });
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
    userSays(text);
    input.value = ""; autosize();

    var local = localUnderstand(text);
    if (!API) { // no backend: quick answers + booking steps only
      if (applyUpdate(local.update)) { sayKey("gotIt"); advance(); return; }
      sayKey(local.faq || "offlineChat");
      render(); return;
    }

    render();
    state.busy = true; sendBtn.disabled = true;
    var typing = el("div", "ta-typing"); typing.setAttribute("aria-label", "…");
    typing.append(el("span"), el("span"), el("span"));
    log.appendChild(typing); scrollDown();
    var started = Date.now();
    post("/api/chat", { messages: apiHistory(), lang: state.lang, mode: "receptionist", booking: state.bk })
      .then(readJson).then(function (res) {
        setTimeout(function () {
          typing.remove();
          if (!res.r.ok) {
            if (applyUpdate(local.update)) { sayKey("gotIt"); return finish(true); }
            if (local.faq) { sayKey(local.faq); return finish(false); }
            state.items.push({ type: "msg", role: "error", key: res.r.status === 429 || res.data.error === "daily_cap" ? "errBusy" : "errNet" });
            return finish(false);
          }
          if (res.data.reply) say(res.data.reply);
          var moved = res.data.bookingUpdate && applyUpdate(res.data.bookingUpdate);
          if (res.data.escalate) state.items.push({ type: "inquiry", prefill: text });
          finish(!!moved);
        }, Math.max(0, 450 - (Date.now() - started)));
      }).catch(function () {
        typing.remove();
        if (applyUpdate(local.update)) { sayKey("gotIt"); return finish(true); }
        state.items.push({ type: "msg", role: "error", key: "errNet" });
        finish(false);
      });
  }
  function finish(moved) {
    state.busy = false; sendBtn.disabled = false;
    if (moved) { state.step = nextStep(); if (ASK[state.step]) sayKey(ASK[state.step]); }
    render();
    if (state.open && !matchMedia("(hover: none)").matches) input.focus();
  }

  /* ---------- Language ---------- */
  function applyLang() {
    lText.textContent = t("launcher");
    launcher.setAttribute("aria-label", t("open"));
    closeBtn.setAttribute("aria-label", t("close"));
    restartBtn.setAttribute("aria-label", t("restart")); restartBtn.title = t("restart");
    title.textContent = t("title"); sub.textContent = t("sub");
    input.placeholder = t("placeholder"); input.setAttribute("aria-label", t("placeholder"));
    sendBtn.setAttribute("aria-label", t("send"));
    fineText.textContent = t("fine"); forgetBtn.textContent = t("forgetLink");
    bEn.setAttribute("aria-pressed", String(state.lang === "en"));
    bEs.setAttribute("aria-pressed", String(state.lang === "es"));
    panel.lang = state.lang;
    renderAll();
  }
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

  /* ---------- Open / close ---------- */
  function openPanel() {
    state.open = true; wrap.classList.add("is-open"); launcher.classList.remove("is-new");
    launcher.setAttribute("aria-expanded", "true");
    renderAll();
    setTimeout(function () { input.focus({ preventScroll: true }); }, 60);
  }
  function closePanel() {
    if (!sheet.hidden) closeBooksy();
    state.open = false; wrap.classList.remove("is-open");
    launcher.setAttribute("aria-expanded", "false");
    launcher.focus({ preventScroll: true });
  }
  launcher.addEventListener("click", openPanel);
  closeBtn.addEventListener("click", closePanel);
  restartBtn.addEventListener("click", function () {
    if (!sheet.hidden) { sheet.hidden = true; booksyBox.textContent = ""; wrap.classList.remove("is-booking"); }
    state.items = []; state.bk = {}; state.step = "start"; render(); input.focus();
  });
  panel.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    e.stopPropagation();
    if (!sheet.hidden) closeBooksy(); else closePanel();
  });

  /* ---------- Composer ---------- */
  function autosize() { input.style.height = "auto"; input.style.height = Math.min(input.scrollHeight, 120) + "px"; }
  input.addEventListener("input", autosize);
  input.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey && !e.isComposing) { e.preventDefault(); sendMessage(input.value); }
  });
  form.addEventListener("submit", function (e) { e.preventDefault(); sendMessage(input.value); });

  /* ---------- Keep visitors on the site: the page's own "Book on Booksy" links open the receptionist ---------- */
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest('a[href*="booksy.com/en-us/1023543"]');
    if (!a || wrap.contains(a) || e.ctrlKey || e.metaKey || e.shiftKey) return;
    e.preventDefault();
    var label = (a.getAttribute("aria-label") || "") + " " + a.textContent;
    var barber = null;
    BARBERS.forEach(function (b) { if (label.indexOf(b) > -1 || (b === "Ricardo" && /\bRick\b/.test(label))) barber = b; });
    if (!state.open) openPanel();
    if (barber) { userSays(barberName(barber)); state.bk.barber = barber; }
    else userSays(t("startBook"));
    advance();
  });

  applyLang();
  window.TribeAssistant = { open: openPanel, close: closePanel, book: function () { openPanel(); advance(); } };
})();
