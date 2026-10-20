import test from "node:test";
import assert from "node:assert/strict";
import { loadChecks, saveChecks } from "../storage.js";

const fake = (init = {}) => { const d = { ...init }; return { getItem: (k) => d[k] ?? null, setItem: (k, v) => { d[k] = v; } }; };

test("loadChecks returns {} when empty or corrupt", () => {
  assert.deepEqual(loadChecks(fake()), {});
  assert.deepEqual(loadChecks(fake({ chk: "{not json" })), {});
});
test("saveChecks round-trips through loadChecks", () => {
  const s = fake();
  assert.equal(saveChecks(s, { "wedding:Venue": true }), true);
  assert.deepEqual(loadChecks(s), { "wedding:Venue": true });
});
test("saveChecks returns false when storage throws", () => {
  assert.equal(saveChecks({ setItem() { throw new Error("full"); } }, {}), false);
});
