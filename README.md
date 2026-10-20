# 🎉 Celebrate – GenAI Event Planner
A planning assistant for weddings, birthdays and community events. Enter your event details and get a budget, timeline, vendor checklist and personalised ideas.

## Gen AI services
- **Google Gemini API (`gemini-3.6-flash(with fallbacks)`)** generates the whole plan as structured JSON (budget, timeline, vendors, ideas). It is called from a Cloudflare Worker (`worker/worker.js`) so the API key never reaches the browser.
- If the AI is unreachable, the app falls back to built-in templates (`planner.js`).

## Architecture
`index.html` + `app.js` (UI, DOM built with `textContent`) → `ai.js` (proxy call, caching, timeout) → `worker/worker.js` (validation, prompt, Gemini) · `planner.js` (pure logic and response sanitising).

## Security, accessibility, testing
- Strict CSP, no `innerHTML`, input validation on client and server, origin-locked CORS, AI output sanitised before render.
- Labelled form controls, landmarks, skip link, live status region, visible focus, colour-contrast tokens, dark mode.
- `npm test` runs unit tests (Node 20+, no dependencies); CI in `.github/workflows/test.yml`.

## Setup
1. Push this repo to GitHub and enable **Settings → Pages → Deploy from branch (main, root)**.
2. Deploy the proxy: `cd worker && npx wrangler deploy`, then `npx wrangler secret put GEMINI_API_KEY`. Set `ALLOWED_ORIGIN` in `wrangler.toml` to your Pages origin.
3. Put the Worker URL in `config.js` as `PROXY_URL` and push.
