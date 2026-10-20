import { validate } from "./planner.js";
import { generatePlan } from "./ai.js";
import { renderPlan } from "./render.js";

const $ = (id) => document.getElementById(id);

/** Reads and length-limits the form values. */
function readForm(form) {
  const f = new FormData(form);
  return {
    type: f.get("type"),
    name: String(f.get("name") || "My event").slice(0, 80),
    date: f.get("date") || "",
    guests: +f.get("guests"),
    budget: +f.get("budget"),
    city: String(f.get("city") || "").slice(0, 60),
    vibe: f.get("vibe"),
    notes: String(f.get("notes") || "").slice(0, 200),
  };
}

$("form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const input = readForm(e.target);
  const errors = validate(input);
  $("err").textContent = errors.join(" ");
  if (errors.length) return;
  $("go").disabled = true;
  $("status").textContent = "Planning your event…";
  const plan = await generatePlan(input);
  $("go").disabled = false;
  $("status").textContent = "Plan ready.";
  renderPlan(plan, input, $("out"));
});

$("print").addEventListener("click", () => window.print());
