// POST /api/inquiry  { name, contact, message, lang, consent: true, website: "" (honeypot) }
// Sends the customer's question to the shop. Nothing is stored here: it is forwarded and forgotten.
// Delivery (set ONE in Vercel environment variables):
//   - Email via Resend: RESEND_API_KEY, INQUIRY_TO, INQUIRY_FROM
//   - Any webhook (Slack, Discord, Make, Zapier...): INQUIRY_WEBHOOK_URL
// With neither set, it answers 503 "not_configured" and the widget shows the Booksy / Instagram fallback.
const { cors, rateLimit, clientIp, readJson, clean, send } = require("../lib/guard");

const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,190}\.[a-z]{2,24}$/i;
const PHONE_RE = /^\+?[\d\s().-]{7,20}$/;

function esc(s) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

async function deliver(inq) {
  const subject = `New website question from ${inq.name}`;
  const text = `Name: ${inq.name}\nContact: ${inq.contact}\nLanguage: ${inq.lang}\n\n${inq.message}\n\n(Sent from Tribe Assistant on the website. The customer agreed to be contacted.)`;

  if (process.env.MOCK_INQUIRY === "1") return "mock";

  if (process.env.RESEND_API_KEY && process.env.INQUIRY_TO && process.env.INQUIRY_FROM) {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.INQUIRY_FROM, to: [process.env.INQUIRY_TO],
        reply_to: EMAIL_RE.test(inq.contact) ? inq.contact : undefined,
        subject, text, html: `<pre style="font:14px/1.5 sans-serif;white-space:pre-wrap">${esc(text)}</pre>`,
      }),
    });
    if (!r.ok) throw new Error("email_" + r.status);
    return "email";
  }
  if (process.env.INQUIRY_WEBHOOK_URL) {
    const r = await fetch(process.env.INQUIRY_WEBHOOK_URL, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: `${subject}\n${text}`, content: `${subject}\n${text}`, inquiry: inq }),
    });
    if (!r.ok) throw new Error("webhook_" + r.status);
    return "webhook";
  }
  return null;
}

module.exports = async function handler(req, res) {
  if (!cors(req, res)) return;
  if (!rateLimit("inq:" + clientIp(req), 3, 3600000)) return send(res, 429, { error: "rate_limited" });

  let b;
  try { b = await readJson(req, 8000); } catch (e) { return send(res, 400, { error: "bad_request" }); }

  if (b.website) return send(res, 200, { ok: true }); // honeypot: bots fill hidden fields; pretend success
  if (b.consent !== true) return send(res, 400, { error: "consent_required" });

  const inq = {
    name: clean(b.name, 80),
    contact: clean(b.contact, 120),
    message: clean(b.message, 1200),
    lang: b.lang === "es" ? "es" : "en",
  };
  const errors = [];
  if (inq.name.length < 2) errors.push("name");
  if (!EMAIL_RE.test(inq.contact) && !PHONE_RE.test(inq.contact)) errors.push("contact");
  if (inq.message.length < 5) errors.push("message");
  if (errors.length) return send(res, 400, { error: "invalid", fields: errors });

  try {
    const via = await deliver(inq);
    if (!via) return send(res, 503, { error: "not_configured" });
    return send(res, 200, { ok: true });
  } catch (e) {
    console.error("[inquiry]", e.message);
    return send(res, 502, { error: "delivery_failed" });
  }
};
