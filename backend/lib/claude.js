// Calls the Claude Messages API with plain fetch (no SDK, no dependencies).
// MOCK_AI=1 swaps in a scripted model so the whole flow can be tested without an API key or any cost.
const { systemPrompt, TOOLS, receptionistPrompt, RECEPTION_TOOLS } = require("./prompt");
const mock = require("./mock");

const API_URL = "https://api.anthropic.com/v1/messages";

// opts.mode === "receptionist": booking-steps prompt + set_booking tool (opts.booking = current choices).
async function askClaude(messages, siteLang, opts) {
  const o = opts || {};
  const reception = o.mode === "receptionist";
  if (process.env.MOCK_AI === "1") return reception ? mock.receptionReply(messages, siteLang, o.booking) : mock.reply(messages, siteLang);

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) { const e = new Error("missing_api_key"); e.status = 503; throw e; }

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 25000);
  let r;
  try {
    r = await fetch(API_URL, {
      method: "POST",
      signal: ctrl.signal,
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: process.env.CLAUDE_MODEL || "claude-haiku-5-5",
        max_tokens: 450,
        temperature: 0.3,
        system: reception ? receptionistPrompt(siteLang, o.booking) : systemPrompt(siteLang),
        tools: reception ? RECEPTION_TOOLS : TOOLS,
        messages,
      }),
    });
  } finally {
    clearTimeout(timer);
  }
  if (!r.ok) {
    const e = new Error("upstream_" + r.status);
    e.status = r.status === 429 || r.status === 529 ? 503 : 502;
    throw e;
  }
  return parse(await r.json());
}

// Turns the API response into { text, booking, bookingUpdate, escalate }.
function parse(data) {
  const out = { text: "", booking: null, bookingUpdate: null, escalate: null };
  for (const block of (data && data.content) || []) {
    if (block.type === "text") out.text += (out.text ? "\n" : "") + block.text;
    if (block.type === "tool_use" && block.name === "show_booking") out.booking = block.input || {};
    if (block.type === "tool_use" && block.name === "set_booking") out.bookingUpdate = block.input || {};
    if (block.type === "tool_use" && block.name === "escalate_to_shop") out.escalate = block.input || {};
  }
  out.text = out.text.trim();
  return out;
}

module.exports = { askClaude, parse };
