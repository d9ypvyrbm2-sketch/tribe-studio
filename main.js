/* The Tribe Studio 1 Maverick — test site script
   Vanilla JS, no libraries. The page works without it (English, all links work). */
(function () {
  "use strict";

  var root = document.documentElement;
  root.classList.remove("no-js");
  root.classList.add("js");

  /* ---------- Language (EN / ES) ---------- */
  var ES = {
    "title": "The Tribe Studio 1 Maverick | Barbería en East Boston",
    "meta.desc": "Barbería en 55 Chelsea St, East Boston. Cortes, barba, line up y color. Calificación 5.0 en Booksy con 424 reseñas. Reserva en línea en Booksy.",
    "skip": "Saltar al contenido principal",
    "newtab": "(se abre en una pestaña nueva)",
    "brand.label": "The Tribe Studio 1 Maverick, inicio",
    "nav.menu": "Menú",
    "nav.label": "Principal",
    "nav.services": "Servicios",
    "nav.barbers": "Barberos",
    "nav.reviews": "Reseñas",
    "nav.visit": "Visítanos",
    "cta.book": "Reserva ya",
    "cta.bookBooksy": "Reserva en Booksy",
    "cta.seePrices": "Ver servicios y precios",
    "cta.pickTime": "Elige servicio y hora",
    "cta.chooseBarber": "Elige tu barbero en Booksy",
    "cta.readReviews": "Leer reseñas en Booksy",
    "cta.directions": "Cómo llegar",
    "hero.eyebrow": "Barbería · 55 Chelsea St, East Boston",
    "hero.title": "Cortes precisos. Líneas limpias. Tu silla te espera.",
    "hero.lede": "Cortes, barba, line up y color con seis barberos, abierto los siete días de la semana. Elige tu barbero y tu hora en Booksy.",
    "rating.short": "en Booksy · 424 reseñas",
    "rating.mobile": "· 424 reseñas",
    "photo.here": "Foto del local aquí",
    "photo.hintHero": "Foto del local o de la silla (del dueño)",
    "photo.hintCut": "Un corte terminado",
    "photo.hintInside": "El interior del local",
    "photo.hintTools": "Sillas y herramientas",
    "band.haircut": "Corte",
    "band.beard": "Barba",
    "band.lineup": "Line up",
    "band.color": "Color",
    "services.kicker": "El menú",
    "services.title": "Servicios y precios",
    "services.lede": "Precios y tiempos según Booksy. El tiempo depende de tu barbero.",
    "services.note": "Los precios pueden cambiar. Booksy siempre muestra el precio actual.",
    "svc.haircut": "Corte de cabello",
    "svc.haircut.desc": "Incluye vapor y lavado de cabello. Keven usa vapor de ozono.",
    "svc.haircut.time": "45 min con Keven · 1 h con Dumar, Jean Carlos, Santi o Kevin T.",
    "svc.haircutAndres": "Corte con Andres",
    "svc.haircutAndres.desc": "Incluye vapor facial y peinado.",
    "svc.beard": "Corte y barba",
    "svc.beard.desc": "Incluye vapor para la barba, lavado y facial.",
    "svc.beard.time": "1 h con Keven · 1 h 15 con Dumar, Jean Carlos, Santi o Kevin T.",
    "svc.beardAndres": "Corte y barba con Andres",
    "svc.beardAndres.desc": "Incluye vapor para la barba, limpieza facial y peinado.",
    "svc.vip.desc": "Mira lo que incluye en Booksy.",
    "svc.lineup": "Line up (perfilado)",
    "svc.lineup.desc": "Perfilado y contorno.",
    "svc.color": "Color de cabello",
    "svc.color.desc": "Para hombres y mujeres.",
    "svc.from": "desde",
    "barbers.kicker": "La tribu",
    "barbers.title": "Conoce a los barberos",
    "barbers.lede": "Seis barberos. Elige el tuyo al reservar.",
    "barber.andres": "Corte $60 · Corte y barba $70",
    "barber.keven": "Corte $40 (45 min) · Corte y barba $50",
    "barber.std": "Corte $40 · Corte y barba $50",
    "reviews.kicker": "Reseñas",
    "reviews.title": "Calificación 5.0 de nuestros clientes",
    "reviews.lede": "Nuestros clientes dejan sus reseñas en Booksy, en inglés y en español. Léelas allí, directo de quienes se sientan en la silla.",
    "reviews.count": "424 reseñas en Booksy",
    "gallery.title": "Cortes frescos, todos los días",
    "gallery.lede": "Mira nuestro trabajo más reciente en Instagram.",
    "visit.kicker": "Visítanos",
    "visit.title": "Encuentra el local",
    "hours.title": "Horario",
    "hours.caption": "Horario por día",
    "hours.week": "9 a. m. – 9 p. m.",
    "hours.sun": "10 a. m. – 6 p. m.",
    "hours.note": "Horario según Booksy. Los días festivos puede cambiar; revisa Booksy antes de venir.",
    "day.mon": "Lunes",
    "day.tue": "Martes",
    "day.wed": "Miércoles",
    "day.thu": "Jueves",
    "day.fri": "Viernes",
    "day.sat": "Sábado",
    "day.sun": "Domingo",
    "today": "Hoy",
    "airport.kicker": "Desde el aeropuerto Logan",
    "airport.title": "A 2.2 millas del aeropuerto",
    "airport.lede": "¿Llegas en avión a Boston? El local queda a pocos minutos en carro de Logan. El mapa muestra la ruta con el tráfico en vivo, y el tiempo de viaje se actualiza con él.",
    "airport.cta": "Cómo llegar desde el aeropuerto",
    "airport.mapSrc": "https://maps.google.com/maps?saddr=Boston+Logan+International+Airport&daddr=55+Chelsea+St,+East+Boston,+MA+02128&layer=t&hl=es&output=embed",
    "airport.mapTitle": "Mapa en vivo: ruta en carro desde el aeropuerto Logan hasta el local, con tráfico",
    "final.title": "¿Listo para un corte fresco?",
    "footer.top": "Volver arriba",
    "footer.test": "Sitio de prueba: no es el sitio oficial de The Tribe Studio y no está afiliado con la barbería ni con Booksy.",
    "entrance.title": "Bienvenido a The Tribe Studio",
    "entrance.door": "Abre la puerta y entra a The Tribe Studio",
    "entrance.hint": "Toca la puerta para entrar",
    "entrance.skip": "Saltar",
    "shop.label": "Dentro de The Tribe Studio",
    "shop.hint": "Toca una silla",
    "shop.more": "Ver el sitio completo",
    "shop.back": "Volver a la barbería",
    "nav.inside": "Dentro de la barbería",
    "chair.booksy": "Reserva en Booksy",
    "chair.services": "Servicios y precios",
    "chair.barbers": "Nuestros barberos",
    "chair.visit": "Horario y cómo llegar",
    "booksy.title": "Tu silla te espera",
    "booksy.text": "Elige tu servicio, tu barbero y tu hora en Booksy. Toma como un minuto."
  };

  // English comes from the HTML itself, so there is only one copy of it.
  var EN = { "title": document.title, "today": "Today" };
  var textNodes = document.querySelectorAll("[data-i18n]");
  var attrNodes = document.querySelectorAll("[data-i18n-attr]");

  textNodes.forEach(function (el) {
    var key = el.getAttribute("data-i18n");
    if (!(key in EN)) EN[key] = el.textContent;
  });
  attrNodes.forEach(function (el) {
    parseAttr(el).forEach(function (pair) {
      if (!(pair.key in EN)) EN[pair.key] = el.getAttribute(pair.attr) || "";
    });
  });

  function parseAttr(el) {
    return el.getAttribute("data-i18n-attr").split(";").map(function (part) {
      var bits = part.split(":");
      return { attr: bits[0].trim(), key: (bits[1] || "").trim() };
    });
  }

  var currentLang = "en";

  function t(key) {
    var dict = currentLang === "es" ? ES : EN;
    return dict[key] != null ? dict[key] : EN[key];
  }

  function setLang(lang) {
    currentLang = lang === "es" ? "es" : "en";
    root.setAttribute("lang", currentLang);
    document.title = t("title");
    textNodes.forEach(function (el) {
      el.textContent = t(el.getAttribute("data-i18n"));
    });
    attrNodes.forEach(function (el) {
      parseAttr(el).forEach(function (pair) { el.setAttribute(pair.attr, t(pair.key)); });
    });
    document.querySelectorAll(".lang-btn").forEach(function (btn) {
      btn.setAttribute("aria-pressed", String(btn.getAttribute("data-lang") === currentLang));
    });
    markToday();
    try { localStorage.setItem("tribe-lang", currentLang); } catch (e) { /* storage blocked: ignore */ }
  }

  document.querySelectorAll(".lang-btn").forEach(function (btn) {
    btn.addEventListener("click", function () { setLang(btn.getAttribute("data-lang")); });
  });

  /* ---------- Today's hours (shop time zone) ---------- */
  function markToday() {
    var day;
    try {
      var name = new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: "America/New_York" }).format(new Date());
      day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(name);
    } catch (e) {
      day = new Date().getDay();
    }
    document.querySelectorAll(".hours-table tr").forEach(function (row) {
      var th = row.querySelector("th");
      var isToday = Number(row.getAttribute("data-day")) === day;
      row.classList.toggle("is-today", isToday);
      if (isToday) {
        th.setAttribute("data-today", t("today"));
        row.setAttribute("aria-current", "date");
      } else {
        th.removeAttribute("data-today");
        row.removeAttribute("aria-current");
      }
    });
  }

  /* ---------- Mobile menu ---------- */
  var toggle = document.querySelector(".menu-toggle");
  var nav = document.getElementById("site-nav");

  function closeMenu(returnFocus) {
    toggle.setAttribute("aria-expanded", "false");
    nav.classList.remove("is-open");
    if (returnFocus) toggle.focus();
  }

  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!open));
      nav.classList.toggle("is-open", !open);
    });
    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) closeMenu(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("is-open")) closeMenu(true);
    });
    document.addEventListener("click", function (e) {
      if (nav.classList.contains("is-open") && !nav.contains(e.target) && !toggle.contains(e.target)) closeMenu(false);
    });
  }

  /* ---------- Header border on scroll ---------- */
  var header = document.querySelector(".site-header");
  function onScroll() { header.classList.toggle("is-scrolled", window.scrollY > 8); }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Gentle reveal on scroll (skipped when reduced motion is on) ---------- */
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var items = document.querySelectorAll(".reveal");
  if (reduce || !("IntersectionObserver" in window)) {
    items.forEach(function (el) { el.classList.add("is-in"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    items.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Start ---------- */
  var saved = null;
  try { saved = localStorage.getItem("tribe-lang"); } catch (e) { /* ignore */ }
  var startLang = saved || ((navigator.language || "").toLowerCase().indexOf("es") === 0 ? "es" : "en");
  setLang(startLang);
})();
