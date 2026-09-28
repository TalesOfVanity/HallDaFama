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

  if (!session) {
    authArea.innerHTML = `
      <a class="button button-small" href="login.html">Entrar</a>
    `;
    return;
  }

  let profile = null;
  try {
    profile = await getProfile(session.user.id);
  } catch {}

  authArea.innerHTML = `
    <span class="user-chip">${profile?.display_name || session.user.email}</span>
    ${profile?.role === "admin" ? '<a href="personagens.html">Registrar personagem</a><a href="admin.html">Brasões</a>' : ""}
    <button class="link-button" id="logout-button">Sair</button>
  `;

  document.querySelector("#logout-button")?.addEventListener("click", logout);
}

updateNavigation();
