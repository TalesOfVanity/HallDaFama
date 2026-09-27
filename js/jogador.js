import { supabase } from "./supabase.js";
import { escapeHTML, formatDate, getQueryParam, initials } from "./utils.js";

const root = document.querySelector("#player-profile");
const id = getQueryParam("id");

async function loadPlayer() {
  if (!id) {
    root.innerHTML = `<p class="status error">Jogador não especificado.</p>`;
    return;
  }

  const { data: player, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    root.innerHTML = `<p class="status error">Jogador não encontrado.</p>`;
    return;
  }

  const { data: badges } = await supabase
    .from("player_badges")
    .select(`
      awarded_at,
      badges (
        id,
        name,
        description,
        icon,
        rarity,
        category
      )
    `)
    .eq("player_id", id)
    .order("awarded_at", { ascending: false });

  const name = player.display_name || player.username || "Jogador";

  root.innerHTML = `
    <section class="profile-hero">
      <div class="avatar avatar-large">
        ${player.avatar_url
          ? `<img src="${escapeHTML(player.avatar_url)}" alt="">`
          : `<span>${escapeHTML(initials(name))}</span>`}
      </div>

      <div>
        <span class="eyebrow">Registro do Reino</span>
        <h1>${escapeHTML(name)}</h1>
        <p>${escapeHTML(player.bio || "Nenhuma biografia registrada.")}</p>
        <div class="meta">
          <span>${escapeHTML(player.country || "—")}</span>
          <span>Desde ${formatDate(player.created_at)}</span>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="section-heading">
        <span class="eyebrow">Insígnias</span>
        <h2>Brasões qualitativos</h2>
      </div>

      <div class="badge-grid">
        ${(badges || []).map(item => {
          const badge = item.badges;
          return `
            <article class="badge-card">
              <div class="badge-icon">
                ${badge?.icon
                  ? `<img src="${escapeHTML(badge.icon)}" alt="">`
                  : "✦"}
              </div>
              <div>
                <h3>${escapeHTML(badge?.name || "Insígnia")}</h3>
                <p>${escapeHTML(badge?.description || "")}</p>
                <small>${escapeHTML(badge?.rarity || "")}</small>
              </div>
            </article>
          `;
        }).join("") || `<p>Nenhuma insígnia conquistada.</p>`}
      </div>
    </section>
  `;
}

loadPlayer();
