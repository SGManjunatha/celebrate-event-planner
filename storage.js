const KEY = "chk";

/** Reads the saved vendor checklist state; returns {} if missing or corrupt. */
export function loadChecks(store) {
  try { return JSON.parse(store.getItem(KEY) || "{}") || {}; } catch { return {}; }
}

/** Saves checklist state; returns false if storage is unavailable. */
export function saveChecks(store, map) {
  try { store.setItem(KEY, JSON.stringify(map)); return true; } catch { return false; }
}
