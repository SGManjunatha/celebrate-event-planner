import { loadChecks, saveChecks } from "./storage.js";

const inr = (n) => "₹" + Math.round(n).toLocaleString("en-IN");

/** Creates an element with safe text content (never innerHTML). */
function el(tag, text, cls) {
  const e = document.createElement(tag);
  if (text !== undefined) e.textContent = text;
  if (cls) e.className = cls;
  return e;
}

function section(id, title) {
  const s = el("section", undefined, "card");
  s.setAttribute("aria-labelledby", id);
  const h = el("h2", title);
  h.id = id; h.tabIndex = -1;
  s.append(h);
  return s;
}

function summaryCard(plan) {
  const s = section("h-sum", "Your plan");
  s.append(el("p", plan.summary || ""), el("p", plan.source === "gemini" ? "Generated with Google Gemini" : "Template plan (AI unavailable)", "mu"));
  return s;
}

function budgetCard(plan) {
  const s = section("h-bud", "Budget");
  plan.budget.forEach((x) => {
    const row = el("div", undefined, "sp");
    row.append(el("span", `${x.category} (${x.percent}%)`), el("strong", inr(x.amount)));
    const bar = el("div", undefined, "bar");
    bar.style.width = Math.min(100, x.percent * 3) + "%";
    bar.setAttribute("role", "presentation");
    s.append(row, bar);
    if (x.tip) s.append(el("p", x.tip, "mu"));
  });
  return s;
}

function timelineCard(plan) {
  const s = section("h-time", "Timeline");
  const ol = el("ol", undefined, "tl");
  plan.timeline.forEach((x) => {
    const li = el("li");
    li.append(el("strong", (x.weeksBefore ? `${x.weeksBefore} wk before` : "Event day") + (x.date ? ` · ${x.date}` : "")), el("div", x.title));
    (x.tasks || []).forEach((k) => li.append(el("div", k, "mu")));
    ol.append(li);
  });
  s.append(ol);
  return s;
}

function vendorCard(plan, input, store) {
  const s = section("h-ven", "Vendor checklist");
  const saved = loadChecks(store);
  plan.vendors.forEach((x, i) => {
    const label = el("label", undefined, "chk"), box = el("input"), k = `${input.type}:${x.name}`;
    box.type = "checkbox"; box.id = "v" + i; box.checked = !!saved[k];
    box.onchange = () => { saved[k] = box.checked; saveChecks(store, saved); };
    label.append(box, el("span", x.name + (x.tip ? ` – ${x.tip}` : "")));
    s.append(label);
  });
  return s;
}

function ideasCard(plan) {
  const s = section("h-idea", "Ideas");
  const ul = el("ul");
  plan.ideas.forEach((x) => ul.append(el("li", x)));
  s.append(ul);
  return s;
}

/**
 * Renders a plan into `out` and moves focus to the first heading.
 * @param {object} plan sanitised plan
 * @param {object} input form values
 * @param {HTMLElement} out container element
 * @param {Storage} [store] storage for checklist state
 */
export function renderPlan(plan, input, out, store = localStorage) {
  const first = summaryCard(plan);
  out.replaceChildren(first, budgetCard(plan), timelineCard(plan), vendorCard(plan, input, store), ideasCard(plan));
  out.hidden = false;
  first.querySelector("h2").focus();
}
