/** Checkpoint 1: saved locally and independently from the vanilla game. */
export const debugDefaults = {
  guaranteedCatches: true,
  shinyMultiplier: 1,
  alwaysShiny: false,
  freeEggs: false,
  instantHatch: false,
  freeRerolls: false,
  maxLuck: false,
  unlimitedStarterPoints: false,
} as const;
export type DebugOptionKey = keyof typeof debugDefaults;
type DebugOptions = { -readonly [K in DebugOptionKey]: (typeof debugDefaults)[K] extends number ? number : boolean };
const KEY = "pokerogue.debugmod.options.v1";
const rates = [1, 2, 4, 8, 16, 32, 64];
export function getDebugOptions(): DebugOptions {
  let saved: Record<string, unknown> = {};
  try {
    saved = JSON.parse(localStorage.getItem(KEY) ?? "{}");
    if (!saved || typeof saved !== "object" || Array.isArray(saved)) saved = {};
  } catch { saved = {}; }
  const result = { ...debugDefaults } as DebugOptions;
  for (const key of Object.keys(debugDefaults) as DebugOptionKey[]) {
    const value = saved[key];
    if (key === "shinyMultiplier") {
      if (typeof value === "number" && rates.includes(value)) result.shinyMultiplier = value;
    } else if (typeof value === "boolean") {
      (result as Record<string, boolean | number>)[key] = value;
    }
  }
  return result;
}
export function getDebugOption<K extends DebugOptionKey>(key: K): DebugOptions[K] {
  return getDebugOptions()[key];
}
export function cycleDebugOption(key: DebugOptionKey): void {
  const options = getDebugOptions();
  if (key === "shinyMultiplier") {
    options.shinyMultiplier = rates[(rates.indexOf(options.shinyMultiplier) + 1) % rates.length];
  } else {
    (options as Record<string, boolean | number>)[key] = !options[key];
  }
  try { localStorage.setItem(KEY, JSON.stringify(options)); }
  catch (error) { console.warn("Debug Mod preference could not be saved", error); }
}
