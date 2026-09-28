import { supabase } from "./supabase.js";
import { escapeHTML } from "./utils.js";

const tbody = document.querySelector("#ranking-body");
const status = document.querySelector("#ranking-status");

async function loadRanking() {
  status.textContent = "Carregando ranking...";

  const { data, error } = await supabase
    .from("ranking")
    .select(`
      player_id,
      display_name,
      username,
      points,
      wins,
      losses,
      draws
    `)
    .order("points", { ascending: false })
    .order("wins", { ascending: false });

  if (error) {
    status.textContent = error.message;
    return;
  }

  tbody.innerHTML = (data || []).map((row, index) => {
    const name = row.display_name || row.username || "Jogador";

    return `
      <tr>
        <td>${index + 1}</td>
        <td>
          <a href="jogador.html?id=${encodeURIComponent(row.player_id)}">
            ${escapeHTML(name)}
          </a>
        </td>
        <td>${row.points ?? 0}</td>
        <td>${row.wins ?? 0}</td>
        <td>${row.losses ?? 0}</td>
        <td>${row.draws ?? 0}</td>
      </tr>
    `;
  }).join("");

  status.textContent = `${data?.length || 0} jogador(es) no ranking.`;
}

loadRanking();
