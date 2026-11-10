// POST /api/chat  { messages: [{role, content}], lang: "en"|"es" }
// -> { reply, booking: {service, barber, date, time, url} | null, escalate: {summary} | null }
// Receptionist mode: body.mode = "receptionist", body.booking = current choices
// -> { reply, bookingUpdate: {service?, barber?, date?} | null, escalate } (values checked against lib/booking.js)
const { cors, rateLimit, dailyCap, clientIp, readJson, validateMessages, send } = require("../lib/guard");
const { askClaude } = require("../lib/claude");
const { BOOKSY_URL } = require("../lib/knowledge");
const { cleanBooking } = require("../lib/booking");

module.exports = async function handler(req, res) {
  if (!cors(req, res)) return;

  const ip = clientIp(req);
  if (!rateLimit("chat:" + ip, Number(process.env.RATE_PER_MINUTE || 8), 60000) ||
      !rateLimit("chat-hour:" + ip, Number(process.env.RATE_PER_HOUR || 60), 3600000)) {
    return send(res, 429, { error: "rate_limited" });
  }

  let body;
  try { body = await readJson(req); } catch (e) {
    return send(res, e.message === "too_large" ? 413 : 400, { error: e.message });
  }
  const messages = validateMessages(body && body.messages);
  if (!messages) return send(res, 400, { error: "invalid_messages" });
  const lang = body.lang === "es" ? "es" : "en";

  if (!dailyCap()) return send(res, 503, { error: "daily_cap" });

  const mode = body.mode === "receptionist" ? "receptionist" : "assistant";
  const current = cleanBooking(body.booking);

  try {
    const out = await askClaude(messages, lang, { mode, booking: current });
    const booking = out.booking && out.booking.service
      ? { service: out.booking.service, barber: out.booking.barber || "", date: out.booking.date || "",
          time: out.booking.time || "", url: BOOKSY_URL }
      : null;
    const escalate = out.escalate ? { summary: String(out.escalate.summary || "").slice(0, 300) } : null;
    let bookingUpdate = null;
    if (out.bookingUpdate) {
      const u = cleanBooking(out.bookingUpdate);
      delete u.customer; // only the customer decides new/returning, by tapping it
      if (Object.keys(u).length) bookingUpdate = u;
    }
    if (!out.text && !booking && !bookingUpdate && !escalate) return send(res, 502, { error: "empty_reply" });
    return send(res, 200, mode === "receptionist"
      ? { reply: out.text, bookingUpdate, escalate }
      : { reply: out.text, booking, escalate });
  } catch (e) {
    console.error("[chat]", e.message); // never log the conversation itself
    return send(res, e.status || 500, { error: "assistant_unavailable" });
  }
};
