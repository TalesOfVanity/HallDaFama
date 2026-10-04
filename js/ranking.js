import { supabase } from "./supabase.js";
import { escapeHTML } from "./utils.js";
import { badgeExp, derivedAward } from "./badges.js";

const status = document.querySelector("#ranking-status");
const playerBody = document.querySelector("#players-ranking-body");
const characterBody = document.querySelector("#characters-ranking-body");
const partyBody = document.querySelector("#partys-ranking-body");

const e = value => escapeHTML(String(value ?? ""));

const participationLabel = value => ({
  interpreter: "Intérprete",
  narrator: "Narrador",
  both: "Ambos"
}[value] || "Intérprete");

async function loadRanking() {
  status.textContent = "Carregando classificações...";

  const [
    profilesRes,
    badgesRes,
    awardsRes,
    charactersRes,
    clansRes,
    characterProgressRes
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, display_name, username, active, participation_type, role")
      .eq("active", true)
      .eq("listed", true),

    supabase
      .from("badges")
      .select("id, name, icon, is_mvp, exp_multiplier, source_scope, progression_mode, progression_steps"),

    supabase
      .from("player_badges")
      .select("player_id, badge_id, rarity, progress_value"),

    supabase
      .from("characters")
      .select("id, owner_id, name, points, clan_id, status")
      .eq("status", "approved"),

    supabase
      .from("clans")
      .select("id, name, status"),

    supabase
      .from("character_badge_progress")
      .select("character_id, badge_id, progress_value")
  ]);

  const failed = [
    profilesRes,
    badgesRes,
    awardsRes,
    charactersRes,
    clansRes,
    characterProgressRes
  ].find(r => r.error);

  if (failed) {
    status.textContent = failed.error.message;
    return;
  }

  const profiles = profilesRes.data || [];
  const badges = badgesRes.data || [];
  const awards = awardsRes.data || [];
  const characters = charactersRes.data || [];
  const clans = clansRes.data || [];
  const characterProgress = characterProgressRes.data || [];

  const profileMap = new Map(
    profiles.map(p => [p.id, p])
  );

  const badgeMap = new Map(badges.map(b => [b.id, b]));

  const clanMap = new Map(
    clans.map(c => [c.id, c])
  );

  // =========================
  // RANKING DE JOGADORES
  // =========================

  const players = profiles
    .map(player => {
      const ownAwards = awards.filter(a => a.player_id === player.id);
      const ownCharacterIds = new Set(characters.filter(c => c.owner_id === player.id).map(c => c.id));
      const sums = new Map();
      characterProgress.forEach(x => { if (ownCharacterIds.has(x.character_id)) sums.set(x.badge_id, (sums.get(x.badge_id)||0) + Number(x.progress_value||0)); });
      const derived = badges.filter(b => b.source_scope === "character").map(b => ({badge:b, award:derivedAward(b,sums.get(b.id)||0)})).filter(x=>x.award);
      const direct = ownAwards.map(a=>({badge:badgeMap.get(a.badge_id),award:a})).filter(x=>x.badge && x.badge.source_scope !== "character");
      const allEarned=[...derived,...direct];

      return {
        ...player,
        badgeCount: allEarned.filter(x=>!x.badge.is_mvp).length,
        points: allEarned.reduce((sum,x)=>sum+badgeExp(x.badge,x.award),0),
        isMvp: direct.some(x=>x.badge?.is_mvp),
        mvpBadge: direct.find(x=>x.badge?.is_mvp)?.badge,

        characterCount: characters.filter(
          c => c.owner_id === player.id
        ).length
      };
    })
    .sort(
      (a, b) =>
        Number(b.isMvp) - Number(a.isMvp) ||
        b.points - a.points ||
        b.badgeCount - a.badgeCount ||
        (a.display_name || "").localeCompare(
          b.display_name || ""
        )
    );

  playerBody.innerHTML = players
    .map((p, i) => `
      <tr>

        <td>
          ${i + 1}
        </td>

        <td>
          <div class="ranking-player-name">
            <a href="jogador.html?id=${encodeURIComponent(p.id)}">${e(p.display_name || p.username || "Jogador")}</a>
            ${p.isMvp ? `<span class="mvp-name-icon" title="MVP — Jogador de maior destaque do período atual">${p.mvpBadge?.icon ? `<img src="${e(p.mvpBadge.icon)}" alt="MVP">` : "◆"}</span>` : ""}
          </div>
        </td>

        <td>
          <div class="player-status-tags">

            <span class="status-tag">
              ${e(participationLabel(p.participation_type))}
            </span>

            ${
              p.role === "admin"
                ? `
                  <span class="status-tag admin-tag">
                    Admin
                  </span>
                `
                : ""
            }

          </div>
        </td>

        <td>
          ${p.points}
        </td>

        <td>
          ${p.badgeCount}
        </td>

        <td>
          ${p.characterCount}
        </td>

      </tr>
    `)
    .join("");

  // =========================
  // RANKING DE PERSONAGENS
  // =========================

  const rankedCharacters = characters
    .filter(c => profileMap.has(c.owner_id))
    .sort(
      (a, b) =>
        Number(b.points || 0) -
          Number(a.points || 0) ||
        a.name.localeCompare(b.name)
    );

  characterBody.innerHTML = rankedCharacters
    .map((c, i) => {
      const player = profileMap.get(c.owner_id);
      const party = clanMap.get(c.clan_id);

      return `
        <tr>

          <td>
            ${i + 1}
          </td>

          <td>
            ${e(c.name)}
          </td>

          <td>
            ${e(
              player?.display_name ||
              player?.username ||
              "Jogador"
            )}
          </td>

          <td>
            ${e(party?.name || "Sem party")}
          </td>

          <td>
            ${Number(c.points || 0)}
          </td>

        </tr>
      `;
    })
    .join("");

  // =========================
  // RANKING DE PARTYS
  // =========================

  const parties = clans
    .filter(c => c.status !== "inactive")
    .map(party => {

      const members = rankedCharacters.filter(
        c => c.clan_id === party.id
      );

      return {
        ...party,

        characterCount: members.length,

        points: members.reduce(
          (sum, c) =>
            sum + Number(c.points || 0),
          0
        )
      };
    })
    .sort(
      (a, b) =>
        b.points - a.points ||
        b.characterCount - a.characterCount ||
        a.name.localeCompare(b.name)
    );

  partyBody.innerHTML = parties
    .map((p, i) => `
      <tr>

        <td>
          ${i + 1}
        </td>

        <td>
          ${e(p.name)}
        </td>

        <td>
          ${p.characterCount}
        </td>

        <td>
          ${p.points}
        </td>

      </tr>
    `)
    .join("");

  status.textContent =
    `${players.length} jogador(es), ` +
    `${rankedCharacters.length} personagem(ns) e ` +
    `${parties.length} Party(s) classificados.`;
}

// =========================
// ABAS DO RANKING
// =========================

document
  .querySelectorAll("[data-ranking-tab]")
  .forEach(button => {

    button.addEventListener("click", () => {

      document
        .querySelectorAll("[data-ranking-tab]")
        .forEach(b =>
          b.classList.toggle(
            "active",
            b === button
          )
        );

      document
        .querySelectorAll("[data-ranking-panel]")
        .forEach(panel => {

          panel.hidden =
            panel.dataset.rankingPanel !==
            button.dataset.rankingTab;

        });

    });

  });

loadRanking();
