// Pure planning logic: no DOM access, so it is easy to test and reuse.
export const TYPES = ["wedding", "birthday", "community"];

export const SPLITS = {
  wedding: [["Venue", 25], ["Catering", 30], ["Decor & flowers", 10], ["Photo & video", 10], ["Attire & beauty", 8], ["Music & entertainment", 5], ["Invitations & gifts", 3], ["Contingency", 9]],
  birthday: [["Venue", 20], ["Food & cake", 35], ["Decor", 12], ["Entertainment", 13], ["Photography", 5], ["Return gifts", 7], ["Invitations", 3], ["Contingency", 5]],
  community: [["Venue & permits", 20], ["Food & refreshments", 25], ["Stage & AV", 15], ["Marketing", 12], ["Volunteers & supplies", 10], ["Entertainment", 8], ["Safety & insurance", 5], ["Contingency", 5]],
};

const TIMELINE = {
  wedding: [[52, "Set budget, guest list and date"], [40, "Book venue, caterer, photographer"], [24, "Order attire; book decor, music, makeup"], [16, "Send invitations; finalise menu"], [8, "Confirm RSVPs, seating, transport"], [4, "Final fittings; confirm vendors in writing"], [1, "Run-through and emergency kit"], [0, "Celebrate!"]],
  birthday: [[8, "Pick theme, date and budget"], [6, "Book venue and caterer; send invites"], [4, "Order cake, decor, return gifts"], [2, "Confirm RSVPs and headcount"], [1, "Collect cake; set up decor"], [0, "Party time!"]],
  community: [[12, "Define purpose, budget, committee; check permits"], [8, "Book venue, sound, sponsors"], [6, "Launch marketing; confirm performers"], [4, "Finalise schedule, catering, safety"], [2, "Brief volunteers; test AV"], [1, "Set up venue; share run-of-show"], [0, "Event day"]],
};

const VENDORS = {
  wedding: ["Venue", "Caterer", "Photographer & videographer", "Decorator & florist", "Priest / officiant", "Makeup artist", "Music / DJ", "Invitation printer", "Transport & stay"],
  birthday: ["Venue", "Caterer / baker", "Decorator", "Entertainer", "Photographer", "Return gifts"],
  community: ["Venue & permission", "Sound & lighting", "Caterer", "Printer", "First aid", "Stage rental", "Photographer"],
};

const IDEAS = {
  Traditional: ["Silk and marigold decor with brass lamps", "Regional banana-leaf meal", "Live classical music"],
  Modern: ["Minimal palette with LED signage", "Interactive food stations", "Instant-print photo booth"],
  Rustic: ["Open-air setup with fairy lights", "Farm-to-table menu", "Wildflowers in clay pots"],
  Playful: ["Theme games with a prize wall", "Colourful balloon arches", "Surprise dance-off"],
  Elegant: ["Candlelit white-and-gold tables", "Plated multi-course dinner", "Soft live vocals"],
};

/** @returns {string[]} human-readable validation errors (empty if valid) */
export function validate(i) {
  const e = [];
  if (!TYPES.includes(i.type)) e.push("Choose an event type.");
  if (!(i.guests >= 1 && i.guests <= 5000)) e.push("Guests must be between 1 and 5000.");
  if (!(i.budget >= 1000)) e.push("Budget must be at least ₹1,000.");
  return e;
}

export function buildBudget(type, total) {
  return SPLITS[type].map(([category, percent]) => ({ category, percent, amount: Math.round((total * percent) / 100) }));
}

/** Dates are computed in UTC so results do not depend on the user's timezone. */
export function buildTimeline(type, dateStr) {
  return TIMELINE[type].map(([weeksBefore, title]) => ({
    weeksBefore,
    title,
    date: dateStr ? new Date(Date.parse(dateStr) - weeksBefore * 7 * 864e5).toISOString().slice(0, 10) : "",
  }));
}

/** Offline plan used when the AI service is unavailable. */
export function fallbackPlan(i) {
  return {
    source: "template",
    summary: `A ${i.vibe || "classic"} ${i.type} for ${i.guests} guests.`,
    budget: buildBudget(i.type, i.budget),
    timeline: buildTimeline(i.type, i.date),
    vendors: VENDORS[i.type].map((name) => ({ name })),
    ideas: IDEAS[i.vibe] || IDEAS.Modern,
  };
}

const str = (v, n = 300) => String(v ?? "").slice(0, n);

/** Coerces untrusted AI JSON into the plan shape, or returns null if unusable. */
export function sanitizePlan(p, i) {
  if (!p || !Array.isArray(p.budget) || !Array.isArray(p.timeline) || !Array.isArray(p.vendors)) return null;
  const budget = p.budget.slice(0, 12).map((b) => ({ category: str(b.category, 60), percent: Math.max(0, Math.min(100, Number(b.percent) || 0)), amount: Math.max(0, Math.round(Number(b.amount) || 0)), tip: str(b.tip, 160) }));
  if (!budget.length) return null;
  return {
    source: "gemini",
    summary: str(p.summary, 400),
    budget,
    timeline: p.timeline.slice(0, 14).map((t) => ({ weeksBefore: Math.max(0, Math.min(104, Number(t.weeksBefore) || 0)), title: str(t.title, 160), tasks: (Array.isArray(t.tasks) ? t.tasks : []).slice(0, 4).map((x) => str(x, 160)), date: i.date ? new Date(Date.parse(i.date) - (Math.max(0, Math.min(104, Number(t.weeksBefore) || 0)) * 7 * 864e5)).toISOString().slice(0, 10) : "" })),
    vendors: p.vendors.slice(0, 15).map((v) => ({ name: str(v.name, 80), tip: str(v.tip, 160) })),
    ideas: (Array.isArray(p.ideas) ? p.ideas : []).slice(0, 8).map((x) => str(x, 200)),
  };
}
