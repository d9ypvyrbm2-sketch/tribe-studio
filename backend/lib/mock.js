// Scripted stand-in for Claude, used only when MOCK_AI=1 (local testing, no API cost).
// It is NOT the real assistant: it only exercises the plumbing (booking card, escalation, languages, errors).

function isSpanish(s) {
  return /[¿¡ñáéíóú]|\b(hola|quiero|cuánto|cuanto|corte|barba|mañana|puedo|reservar|horario|dónde|donde|precio|gracias)\b/i.test(s);
}

function reply(messages, siteLang) {
  const last = messages[messages.length - 1].content;
  const all = messages.filter((m) => m.role === "user").map((m) => m.content).join(" ").toLowerCase();
  const es = isSpanish(last) || (siteLang === "es" && !/[a-z]{3,} (the|is|a|i)\b/i.test(last));
  const L = (en, sp) => (es ? sp : en);

  if (/mock_error/.test(last)) { const e = new Error("upstream_500"); e.status = 502; throw e; }

  const barber = /jean ?carlos/.test(all) ? "Jean Carlos" : /andres/.test(all) ? "Andres Ospina"
    : /keven/.test(all) ? "Keven" : /dumar/.test(all) ? "Dumar Gomez" : /tabares|kevin t/.test(all) ? "Kevin Tabares"
    : /santi/.test(all) ? "Santi Vélez" : "";
  const beard = /beard|barba/.test(all);
  const wantsCut = /fade|haircut|cut|corte|book|reserv|line ?up/.test(all);
  const date = /tomorrow|mañana/.test(all) ? L("Tomorrow", "Mañana") : "";

  if (/parking|estacionamiento|parqueo/i.test(last)) {
    return { text: L("I don't have parking information. I can send your question to the shop.",
      "No tengo información sobre estacionamiento. Puedo enviar tu pregunta a la barbería."),
      booking: null, escalate: { summary: "Customer asks about parking." } };
  }
  if (/hour|open|horario|abren|abierto/i.test(last)) {
    return { text: L("We're open Monday to Saturday 9 AM – 8 PM, and Sunday 10 AM – 4 PM.",
      "Abrimos de lunes a sábado de 9 a. m. a 8 p. m., y el domingo de 10 a. m. a 4 p. m."), booking: null, escalate: null };
  }
  if (/how much|price|cuánto|cuanto|precio/i.test(last) && !/book|reserv/i.test(last)) {
    return { text: beard
      ? L("A Haircut & Beard is $50, or $70 with Andres.", "Corte y barba cuesta $50, o $70 con Andres.")
      : L("A haircut is $40, or $60 with Andres.", "Un corte cuesta $40, o $60 con Andres."), booking: null, escalate: null };
  }
  if (wantsCut || barber) {
    const service = /line ?up/.test(all) ? "Line up"
      : beard ? (barber === "Andres Ospina" ? "Haircut & Beard with Andres" : "Haircut & Beard")
      : (barber === "Andres Ospina" ? "Haircut with Andres" : "Haircut");
    if (!barber && !/any|cualquier/.test(all)) {
      return { text: L(`Great, a bald fade is booked as a ${service}. Do you have a barber in mind, or is any barber fine?`,
        `Perfecto, un bald fade se reserva como ${service === "Haircut" ? "corte" : service}. ¿Tienes un barbero preferido o te sirve cualquiera?`),
        booking: { service }, escalate: null };
    }
    return { text: L("Tap the button below to pick your time on Booksy.", "Toca el botón para elegir tu hora en Booksy."),
      booking: { service, barber: barber || "Any barber", date, time: "" }, escalate: null };
  }
  return { text: L("Hi! I can help with services, prices, barbers, hours and booking. What do you need?",
    "¡Hola! Te ayudo con servicios, precios, barberos, horario y reservas. ¿Qué necesitas?"), booking: null, escalate: null };
}

// Receptionist-mode stand-in: fills booking steps from keywords (set_booking) and answers a few questions.
function bostonDate(offsetDays) {
  const d = new Date(Date.now() + offsetDays * 86400000);
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }).format(d); // YYYY-MM-DD
}

function receptionReply(messages, siteLang, booking) {
  const last = messages[messages.length - 1].content;
  const low = last.toLowerCase();
  const es = isSpanish(last) || siteLang === "es";
  const L = (en, sp) => (es ? sp : en);
  if (/mock_error/.test(last)) { const e = new Error("upstream_500"); e.status = 502; throw e; }

  if (/parking|estacionamiento|parqueo/.test(low)) {
    return { text: L("I don't have parking information. I can send your question to the shop.",
      "No tengo información sobre estacionamiento. Puedo enviar tu pregunta a la barbería."),
      bookingUpdate: null, escalate: { summary: "Customer asks about parking." } };
  }
  if (/hour|open|horario|abren|abierto/.test(low)) {
    return { text: L("We're open Monday to Saturday 9 AM – 8 PM, and Sunday 10 AM – 4 PM.",
      "Abrimos de lunes a sábado de 9 a. m. a 8 p. m., y el domingo de 10 a. m. a 4 p. m."), bookingUpdate: null, escalate: null };
  }
  const u = {};
  if (/line ?up|perfilado/.test(low)) u.service = "Line up";
  else if (/beard|barba/.test(low)) u.service = "Haircut & Beard";
  else if (/fade|haircut|taper|cut|corte/.test(low)) u.service = "Haircut";
  else if (/color|tint/.test(low)) u.service = "Hair color";
  else if (/\bvip\b/.test(low)) u.service = "VIP";
  const barber = /jean ?carlos/.test(low) ? "Jean Carlos" : /andres/.test(low) ? "Andres Ospina"
    : /keven/.test(low) ? "Keven" : /dumar/.test(low) ? "Dumar Gomez" : /tabares|kevin t/.test(low) ? "Kevin Tabares"
    : /santi/.test(low) ? "Santi Vélez" : /ricardo|\brick\b/.test(low) ? "Ricardo" : /any|cualquier/.test(low) ? "Any barber" : "";
  if (barber) u.barber = barber;
  if (/tomorrow|mañana/.test(low)) u.date = bostonDate(1);
  else if (/today|\bhoy\b/.test(low)) u.date = bostonDate(0);

  if (Object.keys(u).length) {
    return { text: L("Got it. Let's set that up.", "Perfecto, vamos a prepararlo."), bookingUpdate: u, escalate: null };
  }
  if (/how much|price|cuánto|cuanto|precio/.test(low)) {
    return { text: L("A haircut is $40, or $60 with Andres. Haircut & Beard is $50, or $70 with Andres.",
      "Un corte cuesta $40, o $60 con Andres. Corte y barba $50, o $70 con Andres."), bookingUpdate: null, escalate: null };
  }
  return { text: L("Happy to help. What would you like to book, or what can I answer for you?",
    "Con gusto. ¿Qué te gustaría reservar o en qué te ayudo?"), bookingUpdate: null, escalate: null };
}

module.exports = { reply, receptionReply, isSpanish };
