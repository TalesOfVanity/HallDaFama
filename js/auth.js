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
  const authArea = document.querySelector("[data-auth-area]");
  if (!authArea) return;

  let session = null;
  try {
    session = await getSession();
  } catch (error) {
    console.error("Erro ao carregar sessão:", error);
  }

  if (!session) {
    authArea.innerHTML = `<a class="button button-small" href="login.html">Entrar</a>`;
    return;
  }

  let profile = null;
  try {
    profile = await getProfile(session.user.id);
  } catch (error) {
    console.error("Erro ao carregar perfil:", error);
  }

  const isAdmin = profile?.role === "admin";
  let unreadMentions = 0;
  let unreadGeneral = 0;
  let pendingRequests = 0;
  try {
    const { count, error } = await supabase
      .from("mention_notifications")
      .select("id", { count: "exact", head: true })
      .eq("mentioned_user_id", session.user.id)
      .is("read_at", null);
    if (!error) unreadMentions = count || 0;
  } catch (error) {
    console.warn("Não foi possível carregar menções:", error);
  }

  try {
    const { count, error } = await supabase.from("site_notifications").select("id", { count: "exact", head: true }).eq("user_id", session.user.id).is("read_at", null);
    if (!error) unreadGeneral = count || 0;
  } catch (error) { console.warn("Não foi possível carregar notificações gerais:", error); }

  if (isAdmin) {
    try {
      const { count, error } = await supabase.from("character_change_requests").select("id", { count: "exact", head: true }).eq("status", "pending");
      if (!error) pendingRequests = count || 0;
    } catch (error) { console.warn("Não foi possível carregar solicitações:", error); }
  }

  const username = profile?.username?.trim();
  const publicProfileUrl = username
    ? `jogador.html?u=${encodeURIComponent(username)}`
    : `jogador.html?id=${encodeURIComponent(session.user.id)}`;
  const displayName = profile?.display_name || username || session.user.email || "Meu Perfil";

  authArea.innerHTML = `
    <div class="user-menu">
      <button type="button" class="user-menu-toggle" aria-expanded="false" aria-haspopup="true">
        ${escapeHtml(displayName)}
        ${unreadMentions ? `<span class="mentions-count">${unreadMentions > 99 ? "99+" : unreadMentions}</span>` : ""}
        <span class="admin-menu-arrow">▾</span>
      </button>
      <div class="user-menu-dropdown">
        <a href="${publicProfileUrl}">Meu Perfil</a>
        <a href="perfil.html">Editar Perfil</a>
        <a href="notificacoes.html">Notificações${(unreadMentions+unreadGeneral) ? ` (${unreadMentions+unreadGeneral})` : ""}</a>
        <a href="favoritos.html">Favoritos</a>
        <a href="minhas-solicitacoes.html">Minhas Solicitações</a>
        <a href="conquistas.html">Conquistas</a>
        <div class="menu-separator"></div>
        <button class="dropdown-logout" id="logout-button" type="button">Sair</button>
      </div>
    </div>
    ${isAdmin ? `
      <div class="admin-menu">
        <button type="button" class="admin-menu-toggle" aria-expanded="false" aria-haspopup="true">
          Administração <span class="admin-menu-arrow">▾</span>
        </button>
        <div class="admin-menu-dropdown">
          <a href="solicitacoes.html">Solicitações${pendingRequests ? ` (${pendingRequests})` : ""}</a>
          <a href="cronicas-admin.html">Temporadas & Eventos</a>
          <a href="personagens.html">Registrar personagem</a>
          <a href="registrar-party.html">Registrar Party</a>
          <a href="admin.html">Brasões</a>
          <a href="gerenciar-jogadores.html">Gerenciar jogadores</a>
        </div>
      </div>` : ""}
  `;

  authArea.querySelector("#logout-button")?.addEventListener("click", logout);

  const menus = authArea.querySelectorAll(".user-menu, .admin-menu");
  menus.forEach(menu => {
    const toggle = menu.querySelector(".user-menu-toggle, .admin-menu-toggle");
    if (!toggle) return;
    toggle.addEventListener("click", event => {
      event.stopPropagation();
      menus.forEach(other => {
        if (other !== menu) {
          other.classList.remove("open");
          other.querySelector(".user-menu-toggle, .admin-menu-toggle")?.setAttribute("aria-expanded", "false");
        }
      });
      const open = menu.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
    });
  });

  document.addEventListener("click", event => {
    menus.forEach(menu => {
      if (!menu.contains(event.target)) {
        menu.classList.remove("open");
        menu.querySelector(".user-menu-toggle, .admin-menu-toggle")?.setAttribute("aria-expanded", "false");
      }
    });
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      menus.forEach(menu => {
        menu.classList.remove("open");
        menu.querySelector(".user-menu-toggle, .admin-menu-toggle")?.setAttribute("aria-expanded", "false");
      });
    }
  });
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;"
  })[char]);
}

updateNavigation();
