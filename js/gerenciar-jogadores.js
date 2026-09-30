import { supabase } from "./supabase.js";
import { getSession, getProfile } from "./auth.js";
import { escapeHTML, initials, setStatus } from "./utils.js";

const list = document.querySelector("#manage-players-list");
const status = document.querySelector("#manage-players-status");
const e = v => escapeHTML(String(v ?? ""));
let currentSession = null;
let profiles = [];
let events = [];

async function guard() {
  const session = await getSession();
  if (!session) { location.href = "login.html"; return null; }
  const profile = await getProfile(session.user.id);
  if (profile.role !== "admin") {
    document.querySelector("#players-admin").innerHTML = '<p class="status error">Acesso restrito aos administradores.</p>';
    return null;
  }
  return session;
}

function matchesFor(playerId) {
  const mine = events.filter(x => x.user_id === playerId);
  const otherIds = new Set();
  for (const a of mine) for (const b of events) {
    if (b.user_id === playerId) continue;
    if (a.ip_hmac === b.ip_hmac || a.network_hmac === b.network_hmac || a.browser_hmac === b.browser_hmac) otherIds.add(b.user_id);
  }
  return [...otherIds].map(id => {
    const p = profiles.find(x => x.id === id);
    if (!p) return null;
    const theirs = events.filter(x => x.user_id === id);
    const sameIp = mine.some(a => theirs.some(b => a.ip_hmac === b.ip_hmac));
    const sameNetwork = mine.some(a => theirs.some(b => a.network_hmac === b.network_hmac));
    const sameBrowser = mine.some(a => theirs.some(b => a.browser_hmac === b.browser_hmac));
    return { p, sameIp, sameNetwork, sameBrowser };
  }).filter(Boolean);
}

function renderSecurity(playerId) {
  const matches = matchesFor(playerId);
  if (!matches.length) return '<div class="security-clear">Nenhuma correspondência técnica encontrada.</div>';
  return `<div class="security-match-list">${matches.map(({p,sameIp,sameNetwork,sameBrowser}) => {
    const name = p.display_name || p.username || "Jogador";
    const flags = [sameIp && "mesmo IP", sameNetwork && !sameIp && "rede semelhante", sameBrowser && "mesmo navegador"].filter(Boolean).join(" · ");
    return `<div class="security-match ${p.moderation_status === "banned" ? "is-banned" : ""}"><strong>${e(name)}</strong><span>${e(flags)}${p.moderation_status === "banned" ? " · CONTA BANIDA" : ""}</span></div>`;
  }).join("")}</div>`;
}

async function load() {
  currentSession = await guard();
  if (!currentSession) return;
  const [profilesRes, charsRes, eventsRes] = await Promise.all([
    supabase.from("profiles").select("id, display_name, username, avatar_url, country, role, active, moderation_status").order("display_name"),
    supabase.from("characters").select("id, owner_id"),
    supabase.from("account_security_events").select("user_id, ip_hmac, network_hmac, browser_hmac, created_at")
  ]);
  if (profilesRes.error) throw profilesRes.error;
  if (charsRes.error) throw charsRes.error;
  if (eventsRes.error) throw eventsRes.error;
  profiles = profilesRes.data || [];
  events = eventsRes.data || [];
  const chars = charsRes.data || [];

  list.innerHTML = profiles.map(p => {
    const name = p.display_name || p.username || "Jogador";
    const count = chars.filter(c => c.owner_id === p.id).length;
    const isSelf = p.id === currentSession.user.id;
    const mod = p.moderation_status || "clear";
    return `<article class="player-card manage-player-card">
      <div class="avatar">${p.avatar_url ? `<img src="${e(p.avatar_url)}" alt="">` : `<span>${e(initials(name))}</span>`}</div>
      <div class="manage-player-info">
        <h3>${e(name)}</h3>
        <p>${e(p.username ? "@" + p.username : "Sem username")} · ${count} personagem(ns)</p>
        <p>${e(p.country || "Localidade não informada")} · ${e(p.role || "player")}</p>
        <p><strong>${p.active === false ? "Removido do Hall da Fama" : "Ativo"}</strong></p>
        <div class="moderation-row"><label>Moderação <select data-moderation="${e(p.id)}" ${isSelf ? "disabled" : ""}><option value="clear" ${mod === "clear" ? "selected" : ""}>Sem marcação</option><option value="watch" ${mod === "watch" ? "selected" : ""}>Observar</option><option value="banned" ${mod === "banned" ? "selected" : ""}>Banido</option></select></label></div>
        <details class="security-details"><summary>Verificação de contas <span>${matchesFor(p.id).length ? `(${matchesFor(p.id).length} correspondência(s))` : ""}</span></summary>${renderSecurity(p.id)}<p class="security-note">Correspondências são indícios técnicos e não confirmam que duas contas pertencem à mesma pessoa.</p></details>
        <div class="form-actions"><button class="button button-small" data-toggle-player="${e(p.id)}" data-active="${p.active !== false}" ${isSelf ? "disabled title=\"Você não pode remover seu próprio perfil administrativo.\"" : ""}>${p.active === false ? "Reativar jogador" : "Remover do site"}</button></div>
      </div></article>`;
  }).join("");
}

list.addEventListener("change", async event => {
  const select = event.target.closest("[data-moderation]");
  if (!select) return;
  const value = select.value;
  if (value === "banned" && !confirm("Marcar este jogador como banido? O perfil também será removido do Hall da Fama.")) { await load(); return; }
  const update = { moderation_status: value };
  if (value === "banned") update.active = false;
  const { error } = await supabase.rpc("admin_set_player_state", { target_user: select.dataset.moderation, new_moderation: value, new_active: value === "banned" ? false : null });
  if (error) return setStatus(status, error.message, "error");
  setStatus(status, "Status de moderação atualizado.", "success");
  await load();
});

list.addEventListener("click", async event => {
  const button = event.target.closest("[data-toggle-player]");
  if (!button || button.disabled) return;
  const currentlyActive = button.dataset.active === "true";
  const action = currentlyActive ? "remover este jogador do Hall da Fama" : "reativar este jogador";
  if (!confirm(`Deseja ${action}? A conta de login não será apagada.`)) return;
  const { error } = await supabase.rpc("admin_set_player_state", { target_user: button.dataset.togglePlayer, new_moderation: null, new_active: !currentlyActive });
  if (error) return setStatus(status, error.message, "error");
  setStatus(status, currentlyActive ? "Jogador removido do Hall da Fama." : "Jogador reativado.", "success");
  await load();
});

(async () => { try { await load(); } catch (err) { setStatus(status, err.message, "error"); } })();
