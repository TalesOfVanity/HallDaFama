import { escapeHTML } from "./utils.js";

export const RARITIES = [
  ["leather", "Couro", 5], ["copper", "Cobre", 10], ["iron", "Ferro", 15],
  ["bronze", "Bronze", 25], ["silver", "Prata", 40], ["gold", "Ouro", 60],
  ["platinum", "Platina", 90], ["emerald", "Esmeralda", 130],
  ["diamond", "Diamante", 180], ["obsidian", "Obsidiana", 250]
];

const rarityMap = new Map(RARITIES.map(([key,label,exp]) => [key,{key,label,exp}]));
const normalize = value => String(value || "leather").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
const aliases = { couro:"leather", cobre:"copper", ferro:"iron", bronze:"bronze", prata:"silver", ouro:"gold", platina:"platinum", esmeralda:"emerald", diamante:"diamond", obsidiana:"obsidian" };
export function rarityInfo(value){ const n=normalize(value); return rarityMap.get(aliases[n] || n) || rarityMap.get("leather"); }
export function badgeExp(badge, award){ if (badge?.is_mvp) return 0; const base=rarityInfo(award?.rarity || badge?.rarity).exp; return Math.round(base * Number(badge?.exp_multiplier || 1)); }
export function badgeFrame(badge, award, size=""){
  const e=v=>escapeHTML(String(v??""));
  if (badge?.is_mvp) return `<div class="badge-frame badge-mvp ${size}">${badge.icon?`<img src="${e(badge.icon)}" alt="">`:"◆"}</div>`;
  const r=rarityInfo(award?.rarity || badge?.rarity);
  return `<div class="badge-frame rarity-${r.key} ${size}" title="${e(r.label)}">${badge?.icon?`<img src="${e(badge.icon)}" alt="">`:"✦"}</div>`;
}

export function rarityFromProgress(badge, progressValue) {
  if (!badge || badge.is_mvp || badge.progression_mode !== "quantitative") return null;
  const steps = Array.isArray(badge.progression_steps) ? badge.progression_steps.map(Number) : [];
  const current = Number(progressValue || 0);
  let index = -1;
  for (let i = 0; i < Math.min(steps.length, RARITIES.length); i++) if (current >= steps[i]) index = i;
  if (index < 0) return null;
  const [key,label,exp] = RARITIES[index];
  return { key,label,exp,index };
}
export function derivedAward(badge, progressValue) {
  const r = rarityFromProgress(badge, progressValue);
  return r ? { rarity:r.key, progress_value:Number(progressValue||0) } : null;
}
