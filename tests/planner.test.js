import test from "node:test";
import assert from "node:assert/strict";
import { SPLITS, validate, buildBudget, buildTimeline, fallbackPlan, sanitizePlan } from "../planner.js";

test("every budget split totals 100%", () => {
  for (const k of Object.keys(SPLITS)) assert.equal(SPLITS[k].reduce((s, [, p]) => s + p, 0), 100);
});
test("validate rejects bad input and accepts good input", () => {
  assert.equal(validate({ type: "wedding", guests: 100, budget: 50000 }).length, 0);
  assert.equal(validate({ type: "x", guests: 0, budget: 10 }).length, 3);
});
test("buildBudget amounts sum close to total", () => {
  const sum = buildBudget("birthday", 100000).reduce((s, b) => s + b.amount, 0);
  assert.ok(Math.abs(sum - 100000) <= 8);
});
test("timeline dates count back from the event date", () => {
  const t = buildTimeline("birthday", "2027-03-15");
  assert.equal(t.at(-1).date, "2027-03-15");
  assert.equal(t[0].date, "2027-01-18");
  assert.equal(buildTimeline("birthday", "")[0].date, "");
});
test("fallbackPlan has every section", () => {
  const p = fallbackPlan({ type: "community", guests: 50, budget: 20000, vibe: "Playful" });
  for (const k of ["budget", "timeline", "vendors", "ideas"]) assert.ok(p[k].length > 0);
});
test("sanitizePlan rejects junk and trims oversize values", () => {
  assert.equal(sanitizePlan(null, {}), null);
  assert.equal(sanitizePlan({ budget: [], timeline: [], vendors: [] }, {}), null);
  const p = sanitizePlan({ budget: [{ category: "A".repeat(500), percent: 999, amount: -5 }], timeline: [{ weeksBefore: 500, title: "t" }], vendors: [{ name: "v" }] }, { date: "2027-01-01" });
  assert.equal(p.budget[0].category.length, 60);
  assert.equal(p.budget[0].percent, 100);
  assert.equal(p.budget[0].amount, 0);
  assert.equal(p.timeline[0].weeksBefore, 104);
});

test("validate rejects out-of-range guests and tiny budgets", () => {
  assert.ok(validate({ type: "wedding", guests: 5001, budget: 50000 }).length > 0);
  assert.ok(validate({ type: "wedding", guests: 10, budget: 999 }).length > 0);
});
test("fallbackPlan uses default ideas for an unknown vibe", () => {
  const p = fallbackPlan({ type: "wedding", guests: 10, budget: 5000, vibe: "???" });
  assert.ok(p.ideas.length > 0);
});
test("sanitizePlan limits tasks per milestone and leaves date empty without one", () => {
  const p = sanitizePlan({ budget: [{ category: "a" }], timeline: [{ weeksBefore: 2, title: "t", tasks: ["1", "2", "3", "4", "5", "6"] }], vendors: [{ name: "v" }] }, {});
  assert.equal(p.timeline[0].tasks.length, 4);
  assert.equal(p.timeline[0].date, "");
});
