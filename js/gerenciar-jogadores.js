import { supabase } from "./supabase.js";
import { getSession, getProfile } from "./auth.js";
import { escapeHTML, initials, setStatus } from "./utils.js";

const list = document.querySelector("#manage-players-list");
const status = document.querySelector("#manage-players-status");
const e = v => escapeHTML(String(v ?? ""));

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

async function load() {
  const session = await guard();
  if (!session) return;

  const [profilesRes, charsRes] = await Promise.all([
    supabase.from("profiles").select("id, display_name, username, avatar_url, country, role, active").order("display_name"),
    supabase.from("characters").select("id, owner_id")
  ]);
  if (profilesRes.error) throw profilesRes.error;
  if (charsRes.error) throw charsRes.error;

  const chars = charsRes.data || [];
  list.innerHTML = (profilesRes.data || []).map(p => {
    const name = p.display_name || p.username || "Jogador";
    const count = chars.filter(c => c.owner_id === p.id).length;
    const isSelf = p.id === session.user.id;
    return `
      <article class="player-card manage-player-card">
        <div class="avatar">
          ${p.avatar_url ? `<img src="${e(p.avatar_url)}" alt="">` : `<span>${e(initials(name))}</span>`}
        </div>
        <div class="manage-player-info">
          <h3>${e(name)}</h3>
          <p>${e(p.username ? "@" + p.username : "Sem username")} · ${count} personagem(ns)</p>
          <p>${e(p.country || "Localidade não informada")} · ${e(p.role || "player")}</p>
          <p><strong>${p.active === false ? "Removido do Hall da Fama" : "Ativo"}</strong></p>
          <div class="form-actions">
            <button class="button button-small" data-toggle-player="${e(p.id)}" data-active="${p.active !== false}" ${isSelf ? "disabled title=\"Você não pode remover seu próprio perfil administrativo.\"" : ""}>
              ${p.active === false ? "Reativar jogador" : "Remover do site"}
            </button>
          </div>
        </div>
      </article>`;
  }).join("");
}

list.addEventListener("click", async event => {
  const button = event.target.closest("[data-toggle-player]");
  if (!button || button.disabled) return;
  const currentlyActive = button.dataset.active === "true";
  const action = currentlyActive ? "remover este jogador do Hall da Fama" : "reativar este jogador";
  if (!confirm(`Deseja ${action}? A conta de login não será apagada.`)) return;

  const { error } = await supabase.from("profiles").update({ active: !currentlyActive }).eq("id", button.dataset.togglePlayer);
  if (error) return setStatus(status, error.message, "error");
  setStatus(status, currentlyActive ? "Jogador removido do Hall da Fama." : "Jogador reativado.", "success");
  await load();
});

(async () => {
  try { await load(); } catch (err) { setStatus(status, err.message, "error"); }
})();
