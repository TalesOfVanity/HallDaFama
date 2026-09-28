import { supabase } from "./supabase.js";
import { escapeHTML } from "./utils.js";

const grid = document.querySelector("#clans-grid");
const status = document.querySelector("#clans-status");

async function loadClans() {
  status.textContent = "Carregando partys...";

  const { data, error } = await supabase
    .from("clans")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    status.textContent = error.message;
    return;
  }

  status.textContent = `${data?.length || 0} party(s) registrada(s).`;

  grid.innerHTML = (data || []).map(clan => `
    <article class="clan-card">
      <div class="clan-emblem">
        ${clan.emblem_url
          ? `<img src="${escapeHTML(clan.emblem_url)}" alt="">`
          : "♜"}
      </div>
      <div>
        <h3>${escapeHTML(clan.name)}</h3>
        <p>${escapeHTML(clan.description || "")}</p>
      </div>
    </article>
  `).join("");
}

loadClans();
