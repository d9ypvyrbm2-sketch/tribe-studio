// Security helpers: CORS, rate limiting, input validation, JSON body parsing.

const DEFAULT_ORIGINS = ["https://d9ypvyrbm2-sketch.github.io"];

function allowedOrigins() {
  const env = (process.env.ALLOWED_ORIGINS || "").split(",").map((s) => s.trim()).filter(Boolean);
  return env.length ? env : DEFAULT_ORIGINS;
}

// Returns true if the request may continue. Answers preflight and blocks unknown origins.
function cors(req, res) {
  const origin = req.headers.origin || "";
  const ok = allowedOrigins().includes(origin);
  if (ok) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Access-Control-Max-Age", "600");
  }
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Cache-Control", "no-store");
  if (req.method === "OPTIONS") {
    res.statusCode = ok ? 204 : 403;
    res.end();
    return false;
  }
  if (!ok) { send(res, 403, { error: "origin_not_allowed" }); return false; }
  if (req.method !== "POST") { send(res, 405, { error: "method_not_allowed" }); return false; }
  return true;
}

// In-memory sliding-window limiter. Good enough for one shop; resets when a serverless instance restarts.
// For stronger limits across instances, add Upstash Redis or Vercel KV (see README).
const buckets = new Map();
function rateLimit(key, limit, windowMs) {
  const now = Date.now();
  const arr = (buckets.get(key) || []).filter((t) => now - t < windowMs);
  if (arr.length >= limit) { buckets.set(key, arr); return false; }
  arr.push(now);
  buckets.set(key, arr);
  if (buckets.size > 5000) buckets.clear(); // memory guard
  return true;
}

// Daily cap across the whole instance, so a runaway client can't run up the API bill.
let day = "", dayCount = 0;
function dailyCap() {
  const max = Number(process.env.DAILY_MESSAGE_CAP || 800);
  const today = new Date().toISOString().slice(0, 10);
  if (today !== day) { day = today; dayCount = 0; }
  if (dayCount >= max) return false;
  dayCount++;
  return true;
}

function clientIp(req) {
  const fwd = (req.headers["x-forwarded-for"] || "").split(",")[0].trim();
  return fwd || req.headers["x-real-ip"] || (req.socket && req.socket.remoteAddress) || "unknown";
}

async function readJson(req, maxBytes = 16000) {
  if (req.body && typeof req.body === "object") return req.body; // Vercel already parsed it
  if (typeof req.body === "string") return JSON.parse(req.body);
  return new Promise((resolve, reject) => {
    let size = 0, data = "", tooBig = false;
    req.on("data", (c) => {
      size += c.length;
      if (size > maxBytes) { tooBig = true; data = ""; return; } // keep draining so we can still answer 413
      data += c;
    });
    req.on("end", () => {
      if (tooBig) return reject(new Error("too_large"));
      try { resolve(JSON.parse(data || "{}")); } catch (e) { reject(new Error("bad_json")); }
    });
    req.on("error", reject);
  });
}

function clean(str, max) {
  if (typeof str !== "string") return "";
  // Strip control characters except newlines/tabs, trim, cap length.
  return str.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim().slice(0, max);
}

// Validates the chat history sent by the browser.
function validateMessages(raw) {
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const msgs = raw.slice(-20).map((m) => ({
    role: m && m.role === "assistant" ? "assistant" : "user",
    content: clean(m && m.content, 1500),
  })).filter((m) => m.content);
  if (!msgs.length || msgs[msgs.length - 1].role !== "user") return null;
  // The API needs the conversation to start with the user and alternate roles: merge neighbours.
  const out = [];
  for (const m of msgs) {
    if (!out.length && m.role === "assistant") continue;
    if (out.length && out[out.length - 1].role === m.role) out[out.length - 1].content += "\n" + m.content;
    else out.push({ ...m });
  }
  return out.length ? out : null;
}

function send(res, status, obj) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(obj));
}

module.exports = { cors, rateLimit, dailyCap, clientIp, readJson, clean, validateMessages, send };
