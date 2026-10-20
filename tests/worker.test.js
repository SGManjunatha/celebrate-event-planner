import test, { afterEach } from "node:test";
import assert from "node:assert/strict";
import worker from "../worker/worker.js";

const ORIGIN = "https://me.github.io";
const env = { ALLOWED_ORIGIN: ORIGIN, GEMINI_API_KEY: "k", RETRY_MS: 0 };
const body = { type: "wedding", guests: 50, budget: 100000, vibe: "Modern" };
const req = (b = body, origin = ORIGIN, method = "POST") => new Request("https://w.dev/", { method, headers: { Origin: origin }, body: method === "POST" ? (typeof b === "string" ? b : JSON.stringify(b)) : undefined });
const gem = (text = '{"ok":true}') => new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text }] } }] }));
const realFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = realFetch; });

test("answers CORS preflight", async () => {
  const r = await worker.fetch(new Request("https://w.dev/", { method: "OPTIONS" }), env);
  assert.equal(r.status, 204);
});
test("rejects other origins and non-POST methods", async () => {
  assert.equal((await worker.fetch(req(body, "https://evil.example"), env)).status, 403);
  assert.equal((await worker.fetch(new Request("https://w.dev/", { method: "GET" }), env)).status, 403);
});
test("rejects oversized, malformed and invalid bodies", async () => {
  assert.equal((await worker.fetch(req("x".repeat(2001)), env)).status, 413);
  assert.equal((await worker.fetch(req("{bad"), env)).status, 400);
  assert.equal((await worker.fetch(req({ ...body, type: "party" }), env)).status, 400);
});
test("returns Gemini JSON on success", async () => {
  globalThis.fetch = async () => gem();
  const r = await worker.fetch(req(), env);
  assert.equal(r.status, 200);
  assert.deepEqual(await r.json(), { ok: true });
  assert.equal(r.headers.get("Access-Control-Allow-Origin"), ORIGIN);
});
test("retries once on 503 with the same model", async () => {
  let n = 0;
  globalThis.fetch = async () => (++n === 1 ? new Response("busy", { status: 503 }) : gem());
  assert.equal((await worker.fetch(req(), env)).status, 200);
  assert.equal(n, 2);
});
test("moves to the next model on 404", async () => {
  const urls = [];
  globalThis.fetch = async (u) => { urls.push(String(u)); return urls.length === 1 ? new Response("gone", { status: 404 }) : gem(); };
  assert.equal((await worker.fetch(req(), env)).status, 200);
  assert.notEqual(urls[0].split("/models/")[1].split(":")[0], urls[1].split("/models/")[1].split(":")[0]);
});
test("returns 502 with details when every model fails", async () => {
  globalThis.fetch = async () => new Response("nope", { status: 404 });
  const r = await worker.fetch(req(), env);
  assert.equal(r.status, 502);
  assert.match(await r.text(), /^Upstream /);
});
test("clamps out-of-range numbers before prompting", async () => {
  let sent = "";
  globalThis.fetch = async (_u, o) => { sent = o.body; return gem(); };
  await worker.fetch(req({ ...body, guests: 99999, budget: 5 }), env);
  assert.match(sent, /5000 guests/);
  assert.match(sent, /₹1000/);
});
