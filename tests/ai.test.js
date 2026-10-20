import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";
import { generatePlan, clearCache } from "../ai.js";

const input = { type: "birthday", guests: 20, budget: 20000, vibe: "Playful", date: "" };
const good = { summary: "s", budget: [{ category: "Food", percent: 50, amount: 10000 }], timeline: [{ weeksBefore: 1, title: "t" }], vendors: [{ name: "v" }], ideas: ["i"] };
const ok = (body) => async () => ({ ok: true, json: async () => body });

beforeEach(() => clearCache());

test("uses the template plan when no proxy URL is configured", async () => {
  let called = false;
  const p = await generatePlan(input, { url: "", fetchFn: async () => { called = true; } });
  assert.equal(p.source, "template");
  assert.equal(called, false);
});
test("returns a sanitised Gemini plan on success", async () => {
  const p = await generatePlan(input, { url: "https://x", fetchFn: ok(good) });
  assert.equal(p.source, "gemini");
  assert.equal(p.budget[0].category, "Food");
});
test("falls back to template on non-OK, bad JSON shape, and network errors", async () => {
  assert.equal((await generatePlan(input, { url: "https://x", fetchFn: async () => ({ ok: false }) })).source, "template");
  clearCache();
  assert.equal((await generatePlan(input, { url: "https://x", fetchFn: ok({ nope: 1 }) })).source, "template");
  clearCache();
  assert.equal((await generatePlan(input, { url: "https://x", fetchFn: async () => { throw new Error("offline"); } })).source, "template");
});
test("caches identical requests", async () => {
  let n = 0;
  const f = async () => { n++; return { ok: true, json: async () => good }; };
  await generatePlan(input, { url: "https://x", fetchFn: f });
  await generatePlan(input, { url: "https://x", fetchFn: f });
  assert.equal(n, 1);
});
test("times out slow requests and falls back", async () => {
  const slow = (_u, { signal }) => new Promise((_, rej) => signal.addEventListener("abort", () => rej(new Error("aborted"))));
  const p = await generatePlan(input, { url: "https://x", fetchFn: slow, timeoutMs: 20 });
  assert.equal(p.source, "template");
});
