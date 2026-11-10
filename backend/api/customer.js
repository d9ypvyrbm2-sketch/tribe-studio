// POST /api/customer — returning-customer memory, only with the customer's consent.
//   { action: "lookup", phone, firstName }                          -> { found: true, firstName, service, barber } | { found: false }
//   { action: "save",   phone, firstName, service, barber, lang, consent: true } -> { ok: true }
//   { action: "forget", phone, firstName }                          -> { ok: true } (same answer whether or not a record existed)
// 503 { error: "store_off" } until the database and CUSTOMER_HASH_SECRET are set up (see README).
const { cors, rateLimit, clientIp, readJson, clean, send } = require("../lib/guard");
const customers = require("../lib/customers");
const { cleanBooking } = require("../lib/booking");

module.exports = async function handler(req, res) {
  if (!cors(req, res)) return;

  const ip = clientIp(req);
  let body;
  try { body = await readJson(req, 4000); } catch (e) {
    return send(res, e.message === "too_large" ? 413 : 400, { error: e.message });
  }
  const action = body && body.action;
  const phone = clean(body && body.phone, 30);
  const firstName = clean(body && body.firstName, 60);
  if (!["lookup", "save", "forget"].includes(action)) return send(res, 400, { error: "bad_action" });
  if (!customers.normalizePhone(phone) || customers.normalizeName(firstName).length < 2) {
    return send(res, 400, { error: "invalid_details" });
  }

  // Lookups are the guessable part, so they get the tightest limits (per visitor, and per phone number).
  const limits = action === "lookup"
    ? [["cust-ip:" + ip, Number(process.env.LOOKUP_PER_HOUR || 6), 3600000],
       ["cust-phone:" + customers.normalizePhone(phone), 10, 86400000]]
    : [["cust-w:" + ip, 10, 3600000]];
  for (const [k, n, ms] of limits) if (!rateLimit(k, n, ms)) return send(res, 429, { error: "rate_limited" });

  try {
    if (action === "lookup") {
      const rec = await customers.lookup(phone, firstName);
      return send(res, 200, rec ? { found: true, firstName: rec.firstName, service: rec.service, barber: rec.barber }
                                : { found: false });
    }
    if (action === "save") {
      if (body.consent !== true) return send(res, 400, { error: "consent_required" });
      const prefs = cleanBooking({ service: body.service, barber: body.barber });
      await customers.save(phone, firstName, { ...prefs, lang: body.lang });
      return send(res, 200, { ok: true });
    }
    await customers.forget(phone, firstName);
    return send(res, 200, { ok: true });
  } catch (e) {
    console.error("[customer]", e.message); // never log phone numbers or names
    return send(res, e.status === 503 ? 503 : 502, { error: e.status === 503 ? "store_off" : "store_error" });
  }
};
