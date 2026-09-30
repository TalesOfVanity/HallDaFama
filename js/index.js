
import { supabase } from "./supabase.js";
import { escapeHTML, avatarHTML } from "./utils.js";

const featured = document.querySelector("#featured-players");

async function loadFeatured() {
  if (!featured) return;

  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, username, avatar_url, country, active")
    .eq("active", true)
    .order("display_name", { ascending: true })
    .limit(6);

  if (error) {
    featured.innerHTML = "<p>Não foi possível carregar os jogadores.</p>";
    return;
  }

  featured.innerHTML = (data || []).map(player => `
    <a class="player-card compact"
       href="jogador.html?id=${encodeURIComponent(player.id)}">
      <div class="avatar">
        ${avatarHTML(
          player.display_name || player.username || "Jogador",
          player.avatar_url,
          `Foto de ${player.display_name || player.username || "Jogador"}`
        )}
      </div>
      <div>
        <h3>${escapeHTML(player.display_name || player.username || "Jogador")}</h3>
        <p>${escapeHTML(player.country || "—")}</p>
      </div>
    </a>
  `).join("");
}


loadFeatured();
