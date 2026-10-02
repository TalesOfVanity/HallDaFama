import { supabase } from "./supabase.js";
import { escapeHTML } from "./utils.js";

const grid = document.querySelector("#clans-grid");
const status = document.querySelector("#clans-status");
const e = value => escapeHTML(String(value ?? ""));

async function load() {
  status.textContent = "Carregando acervo de Partys...";

  const [partiesRes, charactersRes] = await Promise.all([
    supabase.from("clans").select("*").order("name"),
    supabase.from("characters")
      .select("id,name,clan_id,points,status")
      .eq("status", "approved")
  ]);

  if (partiesRes.error) {
    status.textContent = partiesRes.error.message;
    return;
  }
  if (charactersRes.error) {
    status.textContent = charactersRes.error.message;
    return;
  }

  const characters = charactersRes.data || [];
  const parties = (partiesRes.data || []).map(party => {
    const members = characters.filter(c => c.clan_id === party.id);
    return {
      ...party,
      members,
      points: members.reduce((sum, c) => sum + Number(c.points || 0), 0)
    };
  });

  const ranked = parties
    .filter(p => p.status !== "inactive")
    .slice()
    .sort((a, b) =>
      b.points - a.points ||
      b.members.length - a.members.length ||
      a.name.localeCompare(b.name)
    );

  const rankMap = new Map(ranked.map((party, index) => [party.id, index + 1]));

  status.textContent = `${parties.length} Party(s) registrada(s).`;

  grid.innerHTML = parties.map(party => {
    const rank = rankMap.get(party.id);
    const members = party.members.length
      ? party.members.map(member => `<span>${e(member.name)}</span>`).join("")
      : '<span class="party-no-members">Nenhum personagem vinculado.</span>';

    const officialLink = party.official_url
      ? `<a class="party-official-link" href="${e(party.official_url)}" target="_blank" rel="noopener noreferrer">Ver Party <span aria-hidden="true">→</span></a>`
      : '<span class="party-official-link is-disabled">Página não cadastrada</span>';

    return `
      <article class="party-archive-card">
        <div class="party-archive-emblem">
          ${party.emblem_url
            ? `<img src="${e(party.emblem_url)}" alt="Brasão de ${e(party.name)}">`
            : '<span aria-hidden="true">♜</span>'}
        </div>

        <div class="party-archive-content">
          <div class="party-archive-title-row">
            <div>
              <div class="party-archive-kicker">
                ${party.acronym ? `<span class="party-acronym">${e(party.acronym)}</span>` : ""}
                <span class="party-status ${party.status === "inactive" ? "is-inactive" : ""}">${party.status === "inactive" ? "Inativa" : "Ativa"}</span>
              </div>
              <h2>${e(party.name)}</h2>
            </div>
            <div class="party-rank-box">
              <span>Posição no Rank</span>
              <strong>${rank ? `#${rank}` : "—"}</strong>
            </div>
          </div>

          ${party.motto ? `<blockquote class="party-motto">“${e(party.motto)}”</blockquote>` : ""}${party.description ? `<p class="party-archive-description">${e(party.description)}</p>` : ""}

          <div class="party-archive-stats">
            <div><span>Membros</span><strong>${party.members.length}</strong></div>
            <div><span>Pontos</span><strong>${party.points}</strong></div>${party.founded_at?`<div><span>Fundação</span><strong>${new Date(party.founded_at+'T12:00:00').toLocaleDateString('pt-BR')}</strong></div>`:''}
          </div>

          <div class="party-member-list">
            <span class="party-member-label">Membros</span>
            <div class="party-member-chips">${members}</div>
          </div>

          <div class="party-archive-footer">${officialLink}</div>
        </div>
      </article>`;
  }).join("") || '<p>Nenhuma Party registrada.</p>';
}

load();
