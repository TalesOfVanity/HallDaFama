import { supabase } from "./supabase.js";
import { escapeHTML, initials, setStatus } from "./utils.js";

const form = document.querySelector("#profile-form");
const status = document.querySelector("#profile-status");
const preview = document.querySelector("#profile-preview");
let userId = null;

const participationLabel = value => ({
  interpreter: "Intérprete",
  narrator: "Narrador",
  both: "Ambos"
}[value] || "Intérprete");

function renderPreview(profile) {
  const name = profile.display_name || "Jogador";
  preview.innerHTML = `
    <div class="player-card profile-preview-card">
      <div class="avatar profile-preview-avatar">
        ${profile.avatar_url
          ? `<img src="${escapeHTML(profile.avatar_url)}" alt="Foto de ${escapeHTML(name)}">`
          : `<span>${escapeHTML(initials(name))}</span>`}
      </div>
      <div>
        <span class="eyebrow">Prévia pública</span>
        <h3>${escapeHTML(name)}</h3>
        <p>${escapeHTML(profile.country || "Localidade não informada")}</p>
        <div class="player-status-tags">
          <span class="status-tag">${escapeHTML(participationLabel(profile.participation_type))}</span>
          ${profile.role === "admin" ? '<span class="status-tag admin-tag">Admin</span>' : ""}
        </div>
        ${profile.bio ? `<p class="profile-preview-bio">${escapeHTML(profile.bio)}</p>` : ""}
      </div>
    </div>`;
}

async function init() {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session) { window.location.href = "login.html"; return; }

  userId = session.user.id;
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url, country, bio, participation_type, role")
    .eq("id", userId)
    .single();

  if (error) {
    preview.innerHTML = `<p class="status error">${escapeHTML(error.message)}</p>`;
    return;
  }

  form.elements.display_name.value = profile.display_name || "";
  form.elements.avatar_url.value = profile.avatar_url || "";
  form.elements.country.value = profile.country || "";
  form.elements.bio.value = profile.bio || "";
  form.elements.participation_type.value = profile.participation_type || "interpreter";
  form.hidden = false;
  renderPreview(profile);
}

form?.addEventListener("submit", async event => {
  event.preventDefault();
  if (!userId) return;

  const updates = {
    display_name: form.elements.display_name.value.trim(),
    avatar_url: form.elements.avatar_url.value.trim() || null,
    country: form.elements.country.value.trim() || null,
    bio: form.elements.bio.value.trim() || null,
    participation_type: form.elements.participation_type.value
  };

  if (!updates.display_name) { setStatus(status, "Informe seu Nome de Player.", "error"); return; }

  setStatus(status, "Salvando alterações...");
  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", userId)
    .select("id, display_name, avatar_url, country, bio, participation_type, role")
    .single();

  if (error) { setStatus(status, error.message, "error"); return; }

  renderPreview(data);
  setStatus(status, "Perfil atualizado com sucesso.", "success");
  const chip = document.querySelector(".user-chip");
  if (chip) chip.textContent = data.display_name;
});

init();
