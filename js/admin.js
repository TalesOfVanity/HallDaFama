import { supabase } from "./supabase.js";
import { getSession, getProfile } from "./auth.js";
import { escapeHTML, setStatus } from "./utils.js";

const status = document.querySelector("#admin-status");
const badgeForm = document.querySelector("#badge-form");

async function guardAdmin() {
  const session = await getSession();

  if (!session) {
    window.location.href = "login.html";
    return false;
  }

  const profile = await getProfile(session.user.id);

  if (profile.role !== "admin") {
    document.querySelector("#admin-content").innerHTML =
      `<p class="status error">Acesso restrito aos administradores.</p>`;
    return false;
  }

  return true;
}

badgeForm?.addEventListener("submit", async event => {
  event.preventDefault();

  const allowed = await guardAdmin();
  if (!allowed) return;

  const payload = {
    name: badgeForm.name.value.trim(),
    description: badgeForm.description.value.trim(),
    category: badgeForm.category.value.trim(),
    rarity: badgeForm.rarity.value.trim(),
    icon: badgeForm.icon.value.trim() || null
  };

  setStatus(status, "Criando insígnia...");

  const { error } = await supabase.from("badges").insert(payload);

  if (error) {
    setStatus(status, error.message, "error");
    return;
  }

  setStatus(status, "Insígnia criada.", "success");
  badgeForm.reset();
});

guardAdmin();
