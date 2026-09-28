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
    authArea.innerHTML = `
      <a class="button button-small" href="login.html">
        Entrar
      </a>
    `;

    return;
  }

  // =========================
  // CARREGA PERFIL
  // =========================

  let profile = null;

  try {
    profile = await getProfile(session.user.id);
  } catch (error) {
    console.error("Erro ao carregar perfil:", error);
  }

  const isAdmin = profile?.role === "admin";

  // =========================
  // NAVEGAÇÃO
  // =========================

  authArea.innerHTML = `
    <span class="user-chip">
      ${profile?.display_name || session.user.email}
    </span>

    <a href="perfil.html">
      Meu Perfil
    </a>

    ${
      isAdmin
        ? `
          <div class="admin-menu">

            <button
              type="button"
              class="admin-menu-toggle"
              aria-expanded="false"
              aria-haspopup="true"
            >
              Administração
              <span class="admin-menu-arrow">▾</span>
            </button>

            <div class="admin-menu-dropdown">

              <a href="personagens.html">
                Registrar personagem
              </a>

              <a href="registrar-party.html">
                Registrar Party
              </a>

              <a href="admin.html">
                Brasões
              </a>

              <a href="gerenciar-jogadores.html">
                Gerenciar jogadores
              </a>

            </div>

          </div>
        `
        : ""
    }

    <button
      class="link-button"
      id="logout-button"
      type="button"
    >
      Sair
    </button>
  `;

  // =========================
  // LOGOUT
  // =========================

  document
    .querySelector("#logout-button")
    ?.addEventListener("click", logout);

  // =========================
  // MENU ADMIN
  // =========================

  const adminMenu = authArea.querySelector(".admin-menu");
  const adminToggle = authArea.querySelector(".admin-menu-toggle");

  if (adminMenu && adminToggle) {
    adminToggle.addEventListener("click", event => {
      event.stopPropagation();

      const isOpen = adminMenu.classList.toggle("open");

      adminToggle.setAttribute(
        "aria-expanded",
        String(isOpen)
      );
    });

    // Fecha ao clicar fora do menu
    document.addEventListener("click", event => {
      if (!adminMenu.contains(event.target)) {
        adminMenu.classList.remove("open");

        adminToggle.setAttribute(
          "aria-expanded",
          "false"
        );
      }
    });

    // Fecha ao pressionar ESC
    document.addEventListener("keydown", event => {
      if (event.key === "Escape") {
        adminMenu.classList.remove("open");

        adminToggle.setAttribute(
          "aria-expanded",
          "false"
        );
      }
    });

    // Fecha depois que uma opção for escolhida
    adminMenu
      .querySelectorAll(".admin-menu-dropdown a")
      .forEach(link => {
        link.addEventListener("click", () => {
          adminMenu.classList.remove("open");

          adminToggle.setAttribute(
            "aria-expanded",
            "false"
          );
        });
      });
  }
}

updateNavigation();
