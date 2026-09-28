import { supabase } from "./supabase.js";
import { escapeHTML, initials } from "./utils.js";

const grid = document.querySelector("#players-grid");
const search = document.querySelector("#player-search");
const status = document.querySelector("#players-status");

let players = [];

async function loadPlayers() {
  status.textContent = "Carregando jogadores...";

  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, username, avatar_url, country, bio, created_at")
    .order("display_name", { ascending: true });

  if (error) {
    status.textContent = error.message;
    return;
  }

  players = data || [];
  renderPlayers();
}

function renderPlayers() {
  const term = search.value.trim().toLowerCase();

  const filtered = players.filter(player => {
    const text = [
      player.display_name,
      player.username,
      player.country
    ].filter(Boolean).join(" ").toLowerCase();

    return text.includes(term);
  });

  status.textContent = `${filtered.length} jogador(es) encontrado(s).`;

  grid.innerHTML = filtered.map(player => {
    const name = player.display_name || player.username || "Jogador";

    return `
      <a class="player-card" href="jogador.html?id=${encodeURIComponent(player.id)}">
        <div class="avatar">
          ${player.avatar_url
            ? `<img src="${escapeHTML(player.avatar_url)}" alt="">`
            : `<span>${escapeHTML(initials(name))}</span>`}
        </div>
        <div>
          <h3>${escapeHTML(name)}</h3>
          <p>${escapeHTML(player.country || "Localidade não informada")}</p>
        </div>
      </a>
    `;
  }).join("");
}

search?.addEventListener("input", renderPlayers);
loadPlayers();
