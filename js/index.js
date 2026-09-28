
import { supabase } from "./supabase.js";
import { escapeHTML } from "./utils.js";

const featured = document.querySelector("#featured-players");

async function loadFeatured() {
  if (!featured) return;

  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, username, country")
    .limit(6);

  if (error) {
    featured.innerHTML = "<p>Não foi possível carregar os jogadores.</p>";
    return;
  }

  featured.innerHTML = (data || []).map(player => `
    <a class="player-card compact"
       href="jogador.html?id=${encodeURIComponent(player.id)}">
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

async function showAdminButton() {
  const button = document.querySelector("#admin-register-character");
  if (!button) return;

  const {
    data: { user }
  } = await supabase.auth.getUser();

  const ADMIN_UID = "632c1241-d71f-42b0-85a0-cbf739e2625b";

  button.hidden = user?.id !== ADMIN_UID;
}

loadFeatured();
showAdminButton();
