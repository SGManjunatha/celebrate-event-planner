import { PROXY_URL } from "./config.js";
import { fallbackPlan, sanitizePlan } from "./planner.js";

const cache = new Map();

/** Asks the Gemini proxy for a plan; falls back to templates on any failure. */
export async function generatePlan(input) {
  const key = JSON.stringify(input);
  if (cache.has(key)) return cache.get(key);
  let plan = null;
  if (PROXY_URL) {
    try {
      const ctl = new AbortController();
      const timer = setTimeout(() => ctl.abort(), 25000);
      const r = await fetch(PROXY_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: key, signal: ctl.signal });
      clearTimeout(timer);
      if (r.ok) plan = sanitizePlan(await r.json(), input);
    } catch (_) { /* fall through to template plan */ }
  }
  plan = plan || fallbackPlan(input);
  cache.set(key, plan);
  return plan;
}
