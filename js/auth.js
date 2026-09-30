import { supabase } from "./supabase.js";

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();

  if (error) throw error;

  return data.session;
}

export async function requireAuth() {
  const session = await getSession();

  if (!session) {
    window.location.href = "login.html";
    return null;
  }

  return session;
}

export async function getProfile(userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) throw error;

  return data;
}

export async function logout() {
  await supabase.auth.signOut();
  window.location.href = "index.html";
}

export async function updateNavigation() {
  const session = await getSession();
  const authArea = document.querySelector("[data-auth-area]");

  if (!authArea) return;

  // =========================
  // USUÁRIO NÃO LOGADO
  // =========================

  if (!session) {
    const publicProfileUrl = profile?.username
    ? `jogador.html?u=${encodeURIComponent(profile.username)}`
    : `jogador.html?id=${encodeURIComponent(session.user.id)}`;

  authArea.innerHTML = `
    <div class="user-menu">
      <button type="button" class="user-menu-toggle" aria-expanded="false" aria-haspopup="true">
        ${profile?.display_name || profile?.username || "Meu Perfil"}
        ${unreadMentions ? `<span class="mentions-count">${unreadMentions > 99 ? "99+" : unreadMentions}</span>` : ""}
        <span class="admin-menu-arrow">▾</span>
      </button>
      <div class="user-menu-dropdown">
        <a href="${publicProfileUrl}">Meu Perfil</a>
        <a href="perfil.html">Editar Perfil</a>
        <a href="notificacoes.html">Menções${unreadMentions ? ` (${unreadMentions})` : ""}</a>
        <a href="conquistas.html">Conquistas</a>
        <div class="menu-separator"></div>
        <button class="dropdown-logout" id="logout-button" type="button">Sair</button>
      </div>
    </div>
    ${isAdmin ? `
      <div class="admin-menu">
        <button type="button" class="admin-menu-toggle" aria-expanded="false" aria-haspopup="true">Administração <span class="admin-menu-arrow">▾</span></button>
        <div class="admin-menu-dropdown">
          <a href="personagens.html">Registrar personagem</a>
          <a href="registrar-party.html">Registrar Party</a>
          <a href="admin.html">Brasões</a>
          <a href="gerenciar-jogadores.html">Gerenciar jogadores</a>
        </div>
      </div>` : ""}
  `;

  // =========================
  // LOGOUT
  // =========================

  document
    .querySelector("#logout-button")
    ?.addEventListener("click", logout);

  // Menus de usuário e administração
  const menus = authArea.querySelectorAll(".user-menu, .admin-menu");
  menus.forEach(menu => {
    const toggle = menu.querySelector(".user-menu-toggle, .admin-menu-toggle");
    if (!toggle) return;
    toggle.addEventListener("click", event => {
      event.stopPropagation();
      menus.forEach(other => { if (other !== menu) other.classList.remove("open"); });
      const open = menu.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
    });
  });
  document.addEventListener("click", event => {
    menus.forEach(menu => { if (!menu.contains(event.target)) menu.classList.remove("open"); });
  });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") menus.forEach(menu => menu.classList.remove("open"));
  });

}

updateNavigation();
