// Backend tests. No network, no API key, no cost: uses MOCK_AI and MOCK_INQUIRY.
//   node test/run.js
process.env.MOCK_AI = "1";
process.env.MOCK_INQUIRY = "1";
process.env.ALLOWED_ORIGINS = "http://localhost:8080,https://d9ypvyrbm2-sketch.github.io";
process.env.RATE_PER_MINUTE = "8";

const http = require("http");
const fs = require("fs");
const path = require("path");
const assert = require("assert");
const chat = require("../api/chat");
const inquiry = require("../api/inquiry");
const { parse } = require("../lib/claude");
const { systemPrompt, TOOLS } = require("../lib/prompt");
const { validateMessages } = require("../lib/guard");

let pass = 0, fail = 0;
const results = [];
async function test(name, fn) {
  try { await fn(); pass++; results.push("PASS  " + name); }
  catch (e) { fail++; results.push("FAIL  " + name + "\n      " + e.message); }
}

const server = http.createServer((req, res) => {
  if (req.url === "/api/chat") return chat(req, res);
  if (req.url === "/api/inquiry") return inquiry(req, res);
  res.statusCode = 404; res.end();
});

let ipCounter = 0;
function call(p, body, opts = {}) {
  const port = server.address().port;
  return fetch(`http://127.0.0.1:${port}${p}`, {
    method: opts.method || "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: opts.origin === undefined ? "http://localhost:8080" : opts.origin,
      "X-Forwarded-For": opts.ip || `10.0.0.${++ipCounter}`,
    },
    body: opts.method === "OPTIONS" ? undefined : (typeof body === "string" ? body : JSON.stringify(body)),
  }).then(async (r) => ({ status: r.status, headers: r.headers, data: await r.json().catch(() => null) }));
}
const say = (text, lang = "en", extra = []) => call("/api/chat", { messages: [...extra, { role: "user", content: text }], lang });

(async () => {
  await new Promise((r) => server.listen(0, r));

  // ---------- Security ----------
  await test("Unknown website origin is blocked (403)", async () => {
    const r = await say.call(null, "hi"); assert.equal(r.status, 200);
    const bad = await call("/api/chat", { messages: [{ role: "user", content: "hi" }] }, { origin: "https://evil.example" });
    assert.equal(bad.status, 403);
  });
  await test("CORS preflight from the real site is allowed", async () => {
    const r = await call("/api/chat", null, { method: "OPTIONS", origin: "https://d9ypvyrbm2-sketch.github.io" });
    assert.equal(r.status, 204);
    assert.equal(r.headers.get("access-control-allow-origin"), "https://d9ypvyrbm2-sketch.github.io");
  });
  await test("GET is refused (405)", async () => {
    const port = server.address().port;
    const r = await fetch(`http://127.0.0.1:${port}/api/chat`, { headers: { Origin: "http://localhost:8080" } });
    assert.equal(r.status, 405);
  });
  await test("Broken JSON is refused (400)", async () => {
    const r = await call("/api/chat", "{not json");
    assert.equal(r.status, 400);
  });
  await test("Oversized request is refused (413)", async () => {
    const r = await call("/api/chat", { messages: [{ role: "user", content: "x".repeat(20000) }] });
    assert.equal(r.status, 413);
  });
  await test("Empty / malformed history is refused (400)", async () => {
    assert.equal((await call("/api/chat", { messages: [] })).status, 400);
    assert.equal((await call("/api/chat", { messages: [{ role: "assistant", content: "hi" }] })).status, 400);
  });
  await test("Rate limit: 9th message in a minute from one visitor gets 429", async () => {
    let last;
    for (let i = 0; i < 9; i++) last = await call("/api/chat", { messages: [{ role: "user", content: "hi" }] }, { ip: "9.9.9.9" });
    assert.equal(last.status, 429);
  });
  await test("Upstream AI failure returns a clean error, no details leaked", async () => {
    const r = await say("mock_error");
    assert.equal(r.status, 502);
    assert.deepEqual(r.data, { error: "assistant_unavailable" });
  });
  await test("Message history is trimmed, cleaned and made to alternate", () => {
    const out = validateMessages([
      { role: "assistant", content: "welcome" }, { role: "user", content: "a\u0000b" },
      { role: "user", content: "c" }, { role: "hacker", content: "d" },
    ]);
    assert.equal(out.length, 1);
    assert.equal(out[0].role, "user");
    assert.equal(out[0].content, "ab\nc\nd");
  });
  await test("No API key or secret anywhere in the website files", () => {
    const site = path.resolve(__dirname, "../..");
    const files = ["assistant/tribe-assistant.js", "assistant/tribe-assistant.css", "preview/index.html", "index.html"];
    for (const f of files) {
      const s = fs.readFileSync(path.join(site, f), "utf8");
      assert.ok(!/sk-ant-|x-api-key|ANTHROPIC_API_KEY|RESEND_API_KEY/.test(s), f + " mentions a key");
    }
  });
  await test("Live homepage (index.html) is unchanged by this work", () => {
    const s = fs.readFileSync(path.resolve(__dirname, "../../index.html"), "utf8");
    assert.ok(!/tribe-assistant/.test(s));
  });

  // ---------- Conversation plumbing (mock model) ----------
  await test("English: price question answered", async () => {
    const r = await say("How much is a haircut and beard?");
    assert.equal(r.status, 200); assert.match(r.data.reply, /\$50/); assert.match(r.data.reply, /\$70/);
  });
  await test("Spanish: price question answered in Spanish", async () => {
    const r = await say("¿Cuánto cuesta un corte?", "es");
    assert.match(r.data.reply, /cuesta \$40/);
  });
  await test("Booking: 'I want a bald fade' -> asks for barber + Haircut card", async () => {
    const r = await say("I want a bald fade.");
    assert.match(r.data.reply, /barber/i);
    assert.equal(r.data.booking.service, "Haircut");
    assert.match(r.data.booking.url, /^https:\/\/booksy\.com\//);
  });
  await test("Booking: 'Can I book with Jean Carlos?' -> card with Jean Carlos", async () => {
    const r = await say("Can I book with Jean Carlos?");
    assert.equal(r.data.booking.barber, "Jean Carlos");
  });
  await test("Booking: Spanish request with 'mañana' carries the date", async () => {
    const r = await say("Quiero corte y barba con Andres mañana", "es");
    assert.equal(r.data.booking.service, "Haircut & Beard with Andres");
    assert.equal(r.data.booking.date, "Mañana");
  });
  await test("Unknown policy -> escalation offered", async () => {
    const r = await say("Is there parking?");
    assert.ok(r.data.escalate && r.data.escalate.summary);
  });

  // ---------- Inquiry ----------
  const good = { name: "Luis", contact: "luis@example.com", message: "Do you do kids' cuts?", consent: true, lang: "en" };
  await test("Inquiry: valid + consent -> delivered", async () => {
    const r = await call("/api/inquiry", good); assert.equal(r.status, 200); assert.equal(r.data.ok, true);
  });
  await test("Inquiry: no consent -> refused", async () => {
    const r = await call("/api/inquiry", { ...good, consent: false }); assert.equal(r.data.error, "consent_required");
  });
  await test("Inquiry: bad contact -> refused with field", async () => {
    const r = await call("/api/inquiry", { ...good, contact: "nope" }); assert.deepEqual(r.data.fields, ["contact"]);
  });
  await test("Inquiry: phone number accepted", async () => {
    const r = await call("/api/inquiry", { ...good, contact: "(617) 555-0199" }); assert.equal(r.status, 200);
  });
  await test("Inquiry: bot honeypot silently dropped", async () => {
    const r = await call("/api/inquiry", { ...good, website: "spam.biz" }); assert.equal(r.status, 200);
  });
  await test("Inquiry: 4th in an hour from one visitor -> 429", async () => {
    let last; for (let i = 0; i < 4; i++) last = await call("/api/inquiry", good, { ip: "8.8.8.8" });
    assert.equal(last.status, 429);
  });
  await test("Inquiry: no delivery configured -> 503 not_configured", async () => {
    delete process.env.MOCK_INQUIRY;
    const r = await call("/api/inquiry", good); assert.equal(r.data.error, "not_configured");
    process.env.MOCK_INQUIRY = "1";
  });

  // ---------- Real-API wiring (no call made) ----------
  await test("Without MOCK_AI and without a key -> 503, no call to Anthropic", async () => {
    delete process.env.MOCK_AI;
    const r = await say("hi"); assert.equal(r.status, 503);
    process.env.MOCK_AI = "1";
  });
  await test("Claude tool_use response is parsed into reply + booking card", () => {
    const out = parse({ content: [
      { type: "text", text: "Jean Carlos is $40." },
      { type: "tool_use", name: "show_booking", input: { service: "Haircut", barber: "Jean Carlos", date: "Tomorrow" } },
    ] });
    assert.equal(out.text, "Jean Carlos is $40.");
    assert.equal(out.booking.barber, "Jean Carlos");
  });
  await test("System prompt contains every price, barber and hour, and the no-invent rule", () => {
    const p = systemPrompt("en");
    for (const s of ["$40", "$50", "$60", "$70", "$25", "from $150", "Andres Ospina", "Keven", "Dumar Gomez", "Jean Carlos",
      "Kevin Tabares", "Santi Vélez", "9 AM – 9 PM", "10 AM – 6 PM", "55 Chelsea St", "(857) 334-9508", "Never invent"]) {
      assert.ok(p.includes(s), "missing " + s);
    }
    assert.ok(systemPrompt("es").includes("use Spanish"));
  });
  await test("Booking tool only allows the real services and barbers", () => {
    const props = TOOLS[0].input_schema.properties;
    assert.equal(props.service.enum.length, 7);
    assert.equal(props.barber.enum.length, 7);
  });
  await test("Facts match the website's preview page", () => {
    const html = fs.readFileSync(path.resolve(__dirname, "../../preview/index.html"), "utf8");
    for (const s of ["Andres Ospina", "Santi Vélez", "$150", "9 AM – 9 PM", "10 AM – 6 PM", "(857) 334-9508", "456"]) {
      assert.ok(html.includes(s), "website no longer says " + s);
    }
  });

  server.close();
  console.log(results.join("\n"));
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
