import { supabase } from "./supabase.js";
import { escapeHTML } from "./utils.js";

const featured = document.querySelector("#featured-players");

async function loadFeatured() {
  const { data } = await supabase
    .from("profiles")
    .select("id, display_name, username, country")
    .limit(6);

  featured.innerHTML = (data || []).map(player => `
    <a class="player-card compact" href="jogador.html?id=${encodeURIComponent(player.id)}">
      <div class="avatar">
        <span>✦</span>
      </div>
      <div>
        <h3>${escapeHTML(player.display_name || player.username || "Jogador")}</h3>
        <p>${escapeHTML(player.country || "—")}</p>
      </div>
    </a>
  `).join("");
}

loadFeatured();
