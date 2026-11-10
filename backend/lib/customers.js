// Returning-customer memory (server side). Stores only what a customer agreed to save through the website:
// first name, favourite service and barber, language. Nothing from Booksy, no appointment times, no payment data.
//
// Key = HMAC-SHA256(CUSTOMER_HASH_SECRET, phone), so the database never holds a phone number in plain text.
// A record is only returned when the phone AND the first name match (Jean chose "phone number, no code";
// the name check is a free second lock so typing someone's number alone reveals nothing).
//
// Storage: Upstash Redis REST API with plain fetch (no packages). Vercel's Upstash/KV integration sets
// KV_REST_API_URL + KV_REST_API_TOKEN; plain Upstash uses UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN.
// CUSTOMER_STORE=memory uses an in-process map (tests and local practice mode only).
const crypto = require("crypto");

const TTL_SECONDS = 400 * 24 * 3600; // forget customers who haven't been back in ~13 months

function normalizePhone(raw) {
  let d = String(raw || "").replace(/\D/g, "");
  if (d.length === 10) d = "1" + d;            // US number without country code
  if (d.length < 8 || d.length > 15) return null;
  return d;
}

function normalizeName(raw) {
  return String(raw || "").normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toLowerCase().replace(/[^a-z' -]/g, "").trim().split(/\s+/)[0] || "";
}

function keyFor(phone) {
  const secret = process.env.CUSTOMER_HASH_SECRET;
  if (!secret) { const e = new Error("missing_hash_secret"); e.status = 503; throw e; }
  return "cust:" + crypto.createHmac("sha256", secret).update(phone).digest("hex");
}

/* ---------- Stores ---------- */
const mem = new Map();
const memoryStore = {
  async get(k) { const v = mem.get(k); return v ? JSON.parse(v) : null; },
  async set(k, obj) { mem.set(k, JSON.stringify(obj)); },
  async del(k) { mem.delete(k); },
  _clear() { mem.clear(); },
  _dump() { return [...mem.entries()]; },
};

function redisConfig() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url: url.replace(/\/+$/, ""), token } : null;
}

async function redis(cmd) {
  const cfg = redisConfig();
  const r = await fetch(cfg.url, {
    method: "POST",
    headers: { Authorization: "Bearer " + cfg.token, "Content-Type": "application/json" },
    body: JSON.stringify(cmd),
  });
  if (!r.ok) { const e = new Error("store_" + r.status); e.status = 502; throw e; }
  return (await r.json()).result;
}

const redisStore = {
  async get(k) { const v = await redis(["GET", k]); return v ? JSON.parse(v) : null; },
  async set(k, obj) { await redis(["SET", k, JSON.stringify(obj), "EX", String(TTL_SECONDS)]); },
  async del(k) { await redis(["DEL", k]); },
};

function store() {
  if (process.env.CUSTOMER_STORE === "memory") return memoryStore;
  if (redisConfig()) return redisStore;
  const e = new Error("store_not_configured"); e.status = 503; throw e;
}

/* ---------- Operations ---------- */
// Returns the saved favourites only when phone and first name both match; otherwise null (same answer either way).
async function lookup(phoneRaw, nameRaw) {
  const phone = normalizePhone(phoneRaw), name = normalizeName(nameRaw);
  if (!phone || !name) return null;
  const s = store();
  const rec = await s.get(keyFor(phone));
  if (!rec || rec.name !== name) return null;
  return { firstName: rec.firstName, service: rec.service || "", barber: rec.barber || "", lang: rec.lang || "en" };
}

async function save(phoneRaw, firstNameRaw, prefs) {
  const phone = normalizePhone(phoneRaw), name = normalizeName(firstNameRaw);
  if (!phone || !name) return false;
  const s = store();
  const k = keyFor(phone);
  const old = await s.get(k);
  // A different name on the same number is a different person: replace, don't merge.
  const keep = old && old.name === name ? old : null;
  await s.set(k, {
    name,
    firstName: String(firstNameRaw).trim().split(/\s+/)[0].slice(0, 40),
    service: prefs.service || (keep && keep.service) || "",
    barber: prefs.barber || (keep && keep.barber) || "",
    lang: prefs.lang === "es" ? "es" : "en",
    visits: (keep ? keep.visits || 0 : 0) + 1,
    consentAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  return true;
}

// Deletes only when phone and first name match, so nobody can wipe someone else's record by number alone.
async function forget(phoneRaw, nameRaw) {
  const phone = normalizePhone(phoneRaw), name = normalizeName(nameRaw);
  if (!phone || !name) return false;
  const s = store();
  const k = keyFor(phone);
  const rec = await s.get(k);
  if (!rec || rec.name !== name) return false;
  await s.del(k);
  return true;
}

module.exports = { lookup, save, forget, normalizePhone, normalizeName, memoryStore, store };
