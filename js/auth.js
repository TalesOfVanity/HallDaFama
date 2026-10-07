import { supabase } from "./supabase.js";
import { icon } from "./icons.js";
import { initGlobalSearch } from "./global-search.js";
import { initNavigationState } from "./navigation-state.js";

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function requireAuth() {
  const session = await getSession();
  if (!session) {
    window.location.href = "/login";
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
  window.location.href = "/";
}

export async function updateNavigation() {
  // A topbar é reconstruída pelo mesmo código em todas as páginas.
  // Isso evita páginas antigas/cacheadas manterem conjuntos diferentes de links.
  const navLinks = document.querySelector(".nav-links");
  if (navLinks) {
    navLinks.innerHTML = `
      <a href="/jogadores">${icon("users","Jogadores")}</a>
      <a href="/personagens">${icon("user","Personagens")}</a>
      <a href="/ranking">${icon("trophy","Ranking")}</a>
      <a href="/party">${icon("shield","Partys")}</a>
      <a href="/temporadas">${icon("book","Temporadas")}</a>
      <a href="/explorar">${icon("compass","Explorar")}</a>
      <a href="/regulamento">${icon("scroll","Regulamento")}</a>
      <details class="nav-more nav-archive">
        <summary>${icon("archive","Memória")} ${icon("chevronDown","","nav-chevron")}</summary>
        <div class="nav-more-menu">
          <a href="/hall-da-fama">${icon("trophy","Hall da Fama")}</a>
          <a href="/colecao">${icon("bookmark","Minha Coleção")}</a>
        </div>
      </details>
      <span data-auth-area></span>`;
    initGlobalSearch();
  }

  const authArea = document.querySelector("[data-auth-area]");
  if (!authArea) return;

  let session = null;
  try {
    session = await getSession();
  } catch (error) {
    console.error("Erro ao carregar sessão:", error);
  }

  if (!session) {
    authArea.innerHTML = `<a class="button button-small" href="/login">Entrar</a>`;
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
    const { data, error } = await supabase.rpc("get_unread_notification_count");
    if (!error) unreadGeneral = Number(data || 0);
  } catch (error) { console.warn("Não foi possível carregar notificações:", error); }

  if (isAdmin) {
    try {
      const { count, error } = await supabase.from("character_change_requests").select("id", { count: "exact", head: true }).eq("status", "pending");
      if (!error) pendingRequests = count || 0;
    } catch (error) { console.warn("Não foi possível carregar solicitações:", error); }
  }

  const username = profile?.username?.trim();
  const publicProfileUrl = username
    ? `/jogador?u=${encodeURIComponent(username)}`
    : `/jogador?id=${encodeURIComponent(session.user.id)}`;
  const displayName = profile?.display_name || username || session.user.email || "Meu Perfil";

  authArea.innerHTML = `
    <div class="user-menu">
      <button type="button" class="user-menu-toggle" aria-expanded="false" aria-haspopup="true">
        ${escapeHtml(displayName)}
        ${unreadMentions ? `<span class="mentions-count">${unreadMentions > 99 ? "99+" : unreadMentions}</span>` : ""}
        <span class="admin-menu-arrow">▾</span>
      </button>
      <div class="user-menu-dropdown">
        <a href="/meu-tales">${icon("user","Meu Tales")}</a>
        <a href="${publicProfileUrl}">${icon("user","Meu Perfil")}</a>
        <a href="/perfil">${icon("settings","Editar Perfil")}</a>
        <a href="/notificacoes">${icon("bell",`Notificações${(unreadMentions+unreadGeneral) ? ` (${unreadMentions+unreadGeneral})` : ""}`)}</a>
        <a href="/colecao">${icon("bookmark","Minha Coleção")}</a>
        <a href="/minhas-solicitacoes">${icon("inbox","Minhas Solicitações")}</a>
        <a href="/conquistas">${icon("award","Conquistas")}</a>
        <div class="menu-separator"></div>
        <button class="dropdown-logout" id="logout-button" type="button">${icon("logout","Sair")}</button>
      </div>
    </div>
    ${isAdmin ? `
      <div class="admin-menu">
        <button type="button" class="admin-menu-toggle" aria-expanded="false" aria-haspopup="true">
          ${icon("shieldCheck","Administração")} ${icon("chevronDown","","nav-chevron")}
        </button>
        <div class="admin-menu-dropdown">
          <a href="/admin/destaques">${icon("shieldCheck","Painel Administrativo")}</a>
          <a href="/admin/solicitacoes">${icon("inbox",`Solicitações${pendingRequests ? ` (${pendingRequests})` : ""}`)}</a>
          <a href="/admin/temporadas">${icon("calendar","Temporadas & Episódios")}</a>
          <a href="/personagens">${icon("plus","Registrar personagem")}</a>
          <a href="/admin/party">${icon("plus","Registrar Party")}</a>
          <a href="/admin/personagens">${icon("award","Brasões")}</a>
          <a href="/admin/hall-da-fama">${icon("trophy","Hall da Fama")}</a>
          <a href="/admin/jogadores">${icon("userCog","Gerenciar Jogadores")}</a>
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

initNavigationState();
updateNavigation();
