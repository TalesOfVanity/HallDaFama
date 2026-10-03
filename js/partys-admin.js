import { supabase } from "./supabase.js";
import { escapeHTML, setStatus } from "./utils.js";

const area = document.querySelector("#party-admin");
const access = document.querySelector("#party-access-message");
const form = document.querySelector("#party-form");
const title = document.querySelector("#party-form-title");
const message = document.querySelector("#party-message");
const list = document.querySelector("#party-admin-list");
const cancel = document.querySelector("#cancel-party-edit");
let parties = [];
const esc = value => escapeHTML(String(value ?? ""));

async function loadParties() {
  const { data, error } = await supabase.from("clans").select("*").order("name");
  if (error) throw error;
  parties = data || [];
  render();
}

function render() {
  if (!parties.length) {
    list.innerHTML = "<p>Nenhuma party registrada.</p>";
    return;
  }
  list.innerHTML = parties.map(p => `
    <article class="player-card character-mini-card">
      <div class="avatar">${p.emblem_url ? `<img src="${esc(p.emblem_url)}" alt="">` : "♜"}</div>
      <div class="character-mini-info">
        <h3>${esc(p.name)} ${p.acronym ? `<small>· ${esc(p.acronym)}</small>` : ""}</h3>
        <p>${p.status === "inactive" ? "Inativa" : "Ativa"}</p>
        ${p.description ? `<p>${esc(p.description)}</p>` : ""}
        <div class="character-card-actions">
          <button class="button button-small" type="button" data-edit="${esc(p.id)}">Editar</button>
          <button class="button button-small button-danger" type="button" data-delete="${esc(p.id)}">Excluir Party</button>
        </div>
      </div>
    </article>`).join("");
}

function resetForm() {
  form.reset();
  form.elements.id.value = "";
  form.elements.status.value = "active";
  title.textContent = "Nova Party";
  cancel.hidden = true;
  setStatus(message, "");
}

function editParty(id) {
  const p = parties.find(item => item.id === id);
  if (!p) return;
  form.elements.id.value = p.id;
  form.elements.name.value = p.name || "";
  form.elements.acronym.value = p.acronym || "";
  form.elements.emblem_url.value = p.emblem_url || "";
  form.elements.official_url.value = p.official_url || "";
  form.elements.description.value = p.description || "";
  form.elements.status.value = p.status || "active";
  title.textContent = "Editar Party";
  cancel.hidden = false;
  form.scrollIntoView({ behavior: "smooth" });
}

async function deleteParty(id) {
  const p = parties.find(item => item.id === id);
  if (!p || !confirm(`Deseja excluir a Party "${p.name}"?\n\nSe houver personagens vinculados, a exclusão poderá ser recusada para preservar os vínculos.`)) return;
  const { error } = await supabase.from("clans").delete().eq("id", id);
  if (error) return setStatus(message, `Não foi possível excluir: ${error.message}`, "error");
  setStatus(message, "Party excluída com sucesso.", "success");
  await loadParties();
}

form?.addEventListener("submit", async event => {
  event.preventDefault();
  const fd = new FormData(form);
  const id = String(fd.get("id") || "");
  const payload = {
    name: String(fd.get("name") || "").trim(),
    acronym: String(fd.get("acronym") || "").trim() || null,
    emblem_url: String(fd.get("emblem_url") || "").trim() || null,
    official_url: String(fd.get("official_url") || "").trim() || null,
    description: String(fd.get("description") || "").trim() || null,
    status: String(fd.get("status") || "active")
  };
  if (!payload.name) return setStatus(message, "Informe o nome da Party.", "error");
  setStatus(message, "Salvando Party...");
  const result = id
    ? await supabase.from("clans").update(payload).eq("id", id)
    : await supabase.from("clans").insert(payload);
  if (result.error) return setStatus(message, result.error.message, "error");
  setStatus(message, "Party salva com sucesso.", "success");
  resetForm();
  await loadParties();
});

cancel?.addEventListener("click", resetForm);
list?.addEventListener("click", async event => {
  const edit = event.target.closest("[data-edit]");
  const del = event.target.closest("[data-delete]");
  if (edit) editParty(edit.dataset.edit);
  if (del) await deleteParty(del.dataset.delete);
});

async function init() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      access.textContent = "Faça login para acessar esta página.";
      return;
    }
    const { data: profile, error } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (error) throw error;
    if (profile?.role !== "admin") {
      access.textContent = "Esta área é exclusiva para administradores.";
      return;
    }
    area.hidden = false;
    access.hidden = true;
    await loadParties();
  } catch (error) {
    access.textContent = `Não foi possível abrir o gerenciamento de Partys: ${error.message}`;
  }
}
init();
