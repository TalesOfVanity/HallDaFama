
import { supabase } from "./supabase.js";
import { escapeHTML, setStatus } from "./utils.js";

const ADMIN_UID = "632c1241-d71f-42b0-85a0-cbf739e2625b";

const adminArea = document.querySelector("#character-admin");
const accessMessage = document.querySelector("#access-message");
const form = document.querySelector("#character-form");
const message = document.querySelector("#character-status-message");
const characterList = document.querySelector("#character-list");
const ownerSelect = document.querySelector("#character-owner");
const partySelect = document.querySelector("#character-party");
const cancelButton = document.querySelector("#cancel-edit");
const formTitle = document.querySelector("#form-title");

let profiles = [];
let parties = [];
let characters = [];

function escape(value) {
  return escapeHTML(String(value ?? ""));
}

function resetForm() {
  form.reset();
  form.elements.id.value = "";
  form.elements.level.value = 1;
  form.elements.status.value = "pending";
  formTitle.textContent = "Novo personagem";
  cancelButton.hidden = true;
  setStatus(message, "");
}

async function loadProfiles() {
  ownerSelect.replaceChildren();

  const loadingOption = document.createElement("option");
  loadingOption.value = "";
  loadingOption.textContent = "Carregando jogadores...";
  ownerSelect.appendChild(loadingOption);

  console.log("[Personagens] Consultando perfis no Supabase...");

  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, username")
    .order("display_name");

  if (error) {
    profiles = [];

    const errorOption = document.createElement("option");
    errorOption.value = "";
    errorOption.textContent = `Erro: ${error.message}`;
    ownerSelect.replaceChildren(errorOption);

    console.error("[Personagens] Erro ao carregar perfis:", error);
    throw new Error(`Falha ao carregar jogadores: ${error.message}`);
  }

  profiles = data || [];
  ownerSelect.replaceChildren();

  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = profiles.length
    ? "Selecione um jogador"
    : "Nenhum perfil encontrado";

  ownerSelect.appendChild(defaultOption);

  for (const profile of profiles) {
    const option = document.createElement("option");
    option.value = profile.id;
    option.textContent =
      profile.display_name || profile.username || "Jogador";

    ownerSelect.appendChild(option);
  }

  console.log(
    `[Personagens] Perfis carregados: ${profiles.length}`,
    profiles
  );
}

async function loadParties() {
  const { data, error } = await supabase
    .from("clans")
    .select("id, name")
    .order("name");

  if (error) throw error;

  parties = data || [];
  partySelect.replaceChildren();

  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = "Sem party";
  partySelect.appendChild(defaultOption);

  for (const party of parties) {
    const option = document.createElement("option");
    option.value = party.id;
    option.textContent = party.name;
    partySelect.appendChild(option);
  }
}

async function loadCharacters() {
  const { data, error } = await supabase
    .from("characters")
    .select("*")
    .order("name");

  if (error) throw error;

  characters = data || [];
  renderCharacters();
}

function renderCharacters() {
  if (!characters.length) {
    characterList.innerHTML = "<p>Nenhum personagem registrado.</p>";
    return;
  }

  characterList.innerHTML = characters.map(character => {
    const owner = profiles.find(p => p.id === character.owner_id);
    const party = parties.find(p => p.id === character.clan_id);

    const ownerName =
      owner?.display_name ||
      owner?.username ||
      "Jogador não identificado";

    const statusLabels = {
      pending: "Pendente",
      approved: "Aprovado",
      rejected: "Rejeitado"
    };

    const portrait = character.portrait_url
      ? `<img src="${escape(character.portrait_url)}"
           alt="Retrato de ${escape(character.name)}"
           loading="lazy"
           style="width:100%;max-height:240px;object-fit:cover;border-radius:8px;">`
      : "";

    const fichaLink =
      /^https?:\/\//i.test(character.ficha_url || "")
        ? `<p><a href="${escape(character.ficha_url)}"
             target="_blank"
             rel="noopener noreferrer">Abrir ficha anexada no Facebook</a></p>`
        : "";

    return `
      <article class="player-card">
        ${portrait}
        <div>
          <h3>${escape(character.name)}</h3>
          <p>${escape(character.nickname || "Sem alcunha")}</p>
          <p><strong>Jogador:</strong> ${escape(ownerName)}</p>
          <p><strong>Party:</strong> ${escape(party?.name || "Nenhuma")}</p>
          <p><strong>Nível:</strong> ${escape(character.level ?? 1)}</p>
          <p><strong>Fama:</strong> ${escape(character.notoriety || "Não definida")}</p>
          <p><strong>Reputação:</strong> ${escape(character.reputation || "Não definida")}</p>
          <p><strong>Status:</strong>
            ${escape(statusLabels[character.status] || character.status)}
          </p>
          <p>${escape(character.description || "")}</p>
          ${fichaLink}
          <div class="form-actions">
            <button class="button" type="button"
              data-edit="${escape(character.id)}">
              Editar
            </button>
            <button class="button" type="button"
              data-delete="${escape(character.id)}">
              Excluir
            </button>
          </div>
        </div>
      </article>
    `;
  }).join("");
}

function editCharacter(id) {
  const character = characters.find(item => item.id === id);
  if (!character) return;

  form.elements.id.value = character.id;
  form.elements.name.value = character.name || "";
  form.elements.nickname.value = character.nickname || "";
  form.elements.owner_id.value = character.owner_id || "";
  form.elements.description.value = character.description || "";
  form.elements.portrait_url.value = character.portrait_url || "";
  form.elements.ficha_url.value = character.ficha_url || "";
  form.elements.level.value = character.level ?? 1;
  form.elements.notoriety.value = character.notoriety ?? "";
  form.elements.reputation.value = character.reputation ?? "";
  form.elements.clan_id.value = character.clan_id || "";
  form.elements.status.value = character.status || "pending";

  formTitle.textContent = "Editar personagem";
  cancelButton.hidden = false;
  setStatus(message, "");

  form.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function deleteCharacter(id) {
  const character = characters.find(item => item.id === id);
  if (!character) return;

  const confirmed = window.confirm(
    `Deseja excluir o personagem "${character.name}"? Essa ação não pode ser desfeita.`
  );

  if (!confirmed) return;

  const { error } = await supabase
    .from("characters")
    .delete()
    .eq("id", id);

  if (error) {
    setStatus(message, `Erro ao excluir: ${error.message}`, "error");
    return;
  }

  setStatus(message, "Personagem excluído.", "success");
  await loadCharacters();
}

form.addEventListener("submit", async event => {
  event.preventDefault();

  const formData = new FormData(form);
  const id = String(formData.get("id") || "");

  const character = {
    name: String(formData.get("name") || "").trim(),
    nickname: String(formData.get("nickname") || "").trim() || null,
    owner_id: String(formData.get("owner_id") || ""),
    description: String(formData.get("description") || "").trim() || null,
    portrait_url: String(formData.get("portrait_url") || "").trim() || null,
    ficha_url: String(formData.get("ficha_url") || "").trim() || null,
    level: Number(formData.get("level") || 1),
    notoriety: String(formData.get("notoriety") || "").trim() || null,
    reputation: String(formData.get("reputation") || "").trim() || null,
    clan_id: String(formData.get("clan_id") || "") || null,
    status: String(formData.get("status") || "pending")
  };

  if (!character.name) {
    setStatus(message, "Informe o nome do personagem.", "error");
    return;
  }

  if (!character.owner_id) {
    setStatus(message, "Selecione o jogador responsável.", "error");
    return;
  }

  if (!Number.isFinite(character.level) || character.level < 1) {
    setStatus(message, "Informe um nível válido.", "error");
    return;
  }

  setStatus(message, "Salvando personagem...");

  try {
    const result = id
      ? await supabase.from("characters").update(character).eq("id", id)
      : await supabase.from("characters").insert(character);

    if (result.error) {
      setStatus(
        message,
        `Não foi possível salvar: ${result.error.message}`,
        "error"
      );
      return;
    }

    setStatus(message, "Personagem salvo com sucesso.", "success");
    resetForm();
    await loadCharacters();
  } catch (error) {
    setStatus(message, `Erro inesperado: ${error.message}`, "error");
  }
});

cancelButton.addEventListener("click", resetForm);

characterList.addEventListener("click", async event => {
  const editButton = event.target.closest("[data-edit]");
  const deleteButton = event.target.closest("[data-delete]");

  if (editButton) editCharacter(editButton.dataset.edit);
  if (deleteButton) await deleteCharacter(deleteButton.dataset.delete);
});

async function init() {
  try {
    const {
      data: { user },
      error
    } = await supabase.auth.getUser();

    if (error) throw error;

    if (!user) {
      accessMessage.textContent =
        "Entre na sua conta de administrador para continuar.";
      return;
    }

    if (user.id !== ADMIN_UID) {
      accessMessage.textContent = "Acesso restrito ao administrador.";
      return;
    }

    adminArea.hidden = false;
    accessMessage.hidden = true;

    await Promise.all([
      loadProfiles(),
      loadParties()
    ]);

    await loadCharacters();
  } catch (error) {
    accessMessage.hidden = false;
    accessMessage.textContent =
      `Não foi possível carregar a página: ${error.message}`;

    console.error(
      "[Personagens] Erro ao inicializar a página:",
      error
    );
  }
}

init();
