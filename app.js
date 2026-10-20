import { validate } from "./planner.js";
import { generatePlan } from "./ai.js";

const $ = (id) => document.getElementById(id);
const inr = (n) => "₹" + Math.round(n).toLocaleString("en-IN");
const el = (tag, text, cls) => { const e = document.createElement(tag); if (text !== undefined) e.textContent = text; if (cls) e.className = cls; return e; };

function section(id, title) {
  const s = el("section", undefined, "card");
  s.setAttribute("aria-labelledby", id);
  const h = el("h2", title); h.id = id; h.tabIndex = -1;
  s.append(h);
  return s;
}

function render(plan, input) {
  const out = $("out"); out.replaceChildren();
  const head = section("h-sum", "Your plan");
  head.append(el("p", plan.summary || ""), el("p", plan.source === "gemini" ? "Generated with Google Gemini" : "Template plan (AI unavailable)", "mu"));

  const b = section("h-bud", "Budget");
  plan.budget.forEach((x) => {
    const row = el("div", undefined, "sp");
    row.append(el("span", `${x.category} (${x.percent}%)`), el("strong", inr(x.amount)));
    const bar = el("div", undefined, "bar"); bar.style.width = Math.min(100, x.percent * 3) + "%"; bar.setAttribute("role", "presentation");
    b.append(row, bar);
    if (x.tip) b.append(el("p", x.tip, "mu"));
  });

  const t = section("h-time", "Timeline");
  const ol = el("ol", undefined, "tl");
  plan.timeline.forEach((x) => {
    const li = el("li");
    li.append(el("strong", (x.weeksBefore ? `${x.weeksBefore} wk before` : "Event day") + (x.date ? ` · ${x.date}` : "")), el("div", x.title));
    (x.tasks || []).forEach((k) => li.append(el("div", k, "mu")));
    ol.append(li);
  });
  t.append(ol);

  const v = section("h-ven", "Vendor checklist");
  const store = (() => { try { return JSON.parse(localStorage.getItem("chk") || "{}"); } catch (_) { return {}; } })();
  plan.vendors.forEach((x, i) => {
    const id = "v" + i, lab = el("label", undefined, "chk"), cb = el("input"), id2 = `${input.type}:${x.name}`;
    cb.type = "checkbox"; cb.id = id; cb.checked = !!store[id2];
    cb.onchange = () => { store[id2] = cb.checked; try { localStorage.setItem("chk", JSON.stringify(store)); } catch (_) {} };
    lab.append(cb, el("span", x.name + (x.tip ? ` – ${x.tip}` : "")));
    v.append(lab);
  });

  const d = section("h-idea", "Ideas");
  const ul = el("ul"); plan.ideas.forEach((x) => ul.append(el("li", x))); d.append(ul);

  out.append(head, b, t, v, d);
  out.hidden = false;
  head.querySelector("h2").focus();
}

$("form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const f = new FormData(e.target);
  const input = { type: f.get("type"), name: String(f.get("name") || "My event").slice(0, 80), date: f.get("date") || "", guests: +f.get("guests"), budget: +f.get("budget"), city: String(f.get("city") || "").slice(0, 60), vibe: f.get("vibe"), notes: String(f.get("notes") || "").slice(0, 200) };
  const errs = validate(input), box = $("err");
  box.textContent = errs.join(" ");
  if (errs.length) return;
  const btn = $("go"); btn.disabled = true; $("status").textContent = "Planning your event…";
  const plan = await generatePlan(input);
  btn.disabled = false; $("status").textContent = "Plan ready.";
  render(plan, input);
});
$("print").addEventListener("click", () => window.print());
