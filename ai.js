import { PROXY_URL } from "./config.js";
import { fallbackPlan, sanitizePlan } from "./planner.js";

const cache = new Map();

/** Clears the in-memory response cache (used by tests). */
export const clearCache = () => cache.clear();

/**
 * Asks the Gemini proxy for a plan; falls back to templates on any failure.
 * @param {object} input validated form values
 * @param {{url?: string, fetchFn?: Function, timeoutMs?: number}} [opts] overrides for testing
 * @returns {Promise<object>} a plan with a `source` of "gemini" or "template"
 */
export async function generatePlan(input, { url = PROXY_URL, fetchFn = (...a) => globalThis.fetch(...a), timeoutMs = 25000 } = {}) {
  const key = JSON.stringify(input);
  if (cache.has(key)) return cache.get(key);
  let plan = null;
  if (url) {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), timeoutMs);
    try {
      const r = await fetchFn(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: key, signal: ctl.signal });
      if (r.ok) plan = sanitizePlan(await r.json(), input);
    } catch { /* network error or timeout: use template plan */ } finally { clearTimeout(timer); }
  }
  plan = plan || fallbackPlan(input);
  cache.set(key, plan);
  return plan;
}
