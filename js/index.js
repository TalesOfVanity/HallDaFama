import { supabase } from "./supabase.js";
import { escapeHTML, avatarHTML } from "./utils.js";

const featured = document.querySelector("#featured-players");
const eventsRoot = document.querySelector("#home-events");
const randomButton = document.querySelector("#random-character");

async function loadFeatured() {
  if (!featured) return;
  const { data, error } = await supabase.from("profiles").select("id, display_name, username, avatar_url, country, active").eq("active", true).order("display_name", { ascending: true }).limit(6);
  if (error) { featured.innerHTML = "<p>Não foi possível carregar os jogadores.</p>"; return; }
  featured.innerHTML = (data || []).map(player => `<a class="player-card compact" href="jogador.html?${player.username ? `u=${encodeURIComponent(player.username)}` : `id=${encodeURIComponent(player.id)}`}"><div class="avatar">${avatarHTML(player.display_name || player.username || "Jogador", player.avatar_url, `Foto de ${player.display_name || player.username || "Jogador"}`)}</div><div><h3>${escapeHTML(player.display_name || player.username || "Jogador")}</h3><p>${escapeHTML(player.country || "Localidade não informada")}</p></div></a>`).join("");
}

async function loadEvents() {
  if (!eventsRoot) return;
  const { data, error } = await supabase.from("timeline_events").select("id,title,summary,event_type,starts_at").order("starts_at", { ascending: false }).limit(4);
  if (error) { eventsRoot.innerHTML = '<p class="muted">As Crônicas ainda não possuem acontecimentos publicados.</p>'; return; }
  if (!data?.length) { eventsRoot.innerHTML = '<p class="muted">A história ainda está esperando seu primeiro registro.</p>'; return; }
  eventsRoot.innerHTML = data.map(event => `<a class="home-event" href="evento.html?id=${encodeURIComponent(event.id)}"><small>${event.starts_at ? new Date(event.starts_at).toLocaleDateString("pt-BR") : escapeHTML(event.event_type || "Evento")}</small><strong>${escapeHTML(event.title)}</strong>${event.summary ? `<p>${escapeHTML(event.summary)}</p>` : ""}</a>`).join("");
}

randomButton?.addEventListener("click", async () => {
  randomButton.disabled = true;
  randomButton.textContent = "Procurando...";
  const { data } = await supabase.from("characters").select("id").eq("status", "approved").limit(200);
  if (data?.length) {
    const chosen = data[Math.floor(Math.random() * data.length)];
    window.location.href = `personagem.html?id=${encodeURIComponent(chosen.id)}`;
    return;
  }
  randomButton.disabled = false;
  randomButton.textContent = "Nenhum personagem disponível";
});

Promise.allSettled([loadFeatured(), loadEvents()]);
