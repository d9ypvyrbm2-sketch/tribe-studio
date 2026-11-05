# Tribe Assistant — backend

The AI receptionist for The Tribe Studio website. The website (GitHub Pages) shows the chat; this small
Vercel backend holds the Claude API key and talks to Claude. **No key ever reaches the browser.**

```
Visitor's browser ──► GitHub Pages site (assistant/tribe-assistant.js)
                          │  POST /api/chat, /api/inquiry  (only from allowed origins)
                          ▼
                   Vercel serverless (this folder)  ── ANTHROPIC_API_KEY (env var)
                          │
                          ├─► Claude API (claude-haiku-5-5)
                          └─► Shop inbox (Resend email or a webhook) for inquiries
```

No npm packages. Node 18+ (uses built-in `fetch`).

## Files

| File | What it does |
|---|---|
| `api/chat.js` | Chat endpoint: CORS, rate limit, validation, calls Claude, returns reply + booking card |
| `api/inquiry.js` | Sends a customer's question to the shop, only with consent. Stores nothing |
| `lib/knowledge.js` | **The only facts the assistant knows**: prices, barbers, hours, address, Booksy link. Edit here when anything changes |
| `lib/prompt.js` | Assistant's instructions and the two tools (booking card, escalate to shop) |
| `lib/guard.js` | CORS allowlist, per-visitor and daily limits, input cleaning |
| `lib/claude.js` | Calls the Claude API with plain `fetch` |
| `lib/mock.js` | Scripted fake model for testing without cost (`MOCK_AI=1`) |
| `dev-server.js` | Local test: site on :8080, API on :8787 |
| `test/run.js` | 29 backend tests, no network or cost |

## Environment variables (Vercel → Project → Settings → Environment Variables)

| Name | Required | Example / default |
|---|---|---|
| `ANTHROPIC_API_KEY` | yes | from console.anthropic.com (needs Jean's approval: paid) |
| `ALLOWED_ORIGINS` | recommended | `https://d9ypvyrbm2-sketch.github.io` (default). Add the real domain later, comma-separated |
| `CLAUDE_MODEL` | no | `claude-haiku-5-5` |
| `RATE_PER_MINUTE` / `RATE_PER_HOUR` | no | `8` / `60` messages per visitor |
| `DAILY_MESSAGE_CAP` | no | `800` messages per day per instance (cost ceiling) |
| `RESEND_API_KEY`, `INQUIRY_TO`, `INQUIRY_FROM` | for inquiries (option A) | email the shop via resend.com (free tier) |
| `INQUIRY_WEBHOOK_URL` | for inquiries (option B) | Slack/Discord/Make/Zapier webhook |

Without inquiry delivery set up, the form politely shows the shop's phone and Instagram instead.

## Deploy (after Jean approves)

1. Vercel → **Add New Project** → import `d9ypvyrbm2-sketch/tribe-studio` → **Root Directory: `backend`** → Framework: Other → Deploy.
2. Add the environment variables above, then **Redeploy**.
3. Copy the URL, e.g. `https://tribe-assistant.vercel.app`.
4. In `preview/index.html` set `data-api="https://tribe-assistant.vercel.app"` on the assistant script tag, push, and test at `/preview/`.
5. When Jean is happy, add the same two lines to the live `index.html`:
   ```html
   <link rel="stylesheet" href="assistant/tribe-assistant.css">            <!-- in <head> -->
   <script src="assistant/tribe-assistant.js" data-api="https://…vercel.app" defer></script>  <!-- before </body> -->
   ```
6. In the Anthropic console, set a **monthly spend limit** (e.g. $20) as a second safety net.

## Test locally (free)

```bash
cd backend
npm test                 # 29 backend tests
npm run dev              # then open http://localhost:8080/preview/ with window.TRIBE_ASSISTANT_API="http://localhost:8787"
```

## Booksy

Booksy has no self-serve public API. Its partner API is invite-only (alpha), so the assistant cannot see availability
or create bookings. It collects the service, barber, date and time, then sends the customer to the official Booksy page.
If the shop gets Booksy partner API access later, `show_booking` is the place to plug it in.

## Limits to know

- Rate limits live in memory per serverless instance. Fine for one shop; for stricter limits add Upstash Redis.
- Booksy link opens the shop page, not a pre-filled service/barber (Booksy doesn't publish deep links).
- The assistant only knows what is in `lib/knowledge.js`. Update it when prices or barbers change.
