import { supabase } from "./supabase.js";
import { escapeHTML, setStatus, initials, avatarHTML } from "./utils.js";

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
let profiles = [], parties = [], characters = [], isAdmin = false;
const esc = v => escapeHTML(String(v ?? ""));

async function loadProfiles() {
  const { data, error } = await supabase.from("profiles").select("id, display_name, username, avatar_url").order("display_name");
  if (error) throw new Error(`Falha ao carregar jogadores: ${error.message}`);
  profiles = data || [];
  if (!ownerSelect) return;
  ownerSelect.innerHTML = '<option value="">Selecione um jogador</option>' + profiles.map(p => `<option value="${esc(p.id)}">${esc(p.display_name || p.username || "Jogador")}</option>`).join("");
}

async function loadParties() {
  const { data, error } = await supabase.from("clans").select("id, name").order("name");
  if (error) { console.warn("Partys indisponíveis:", error.message); parties = []; }
  else parties = data || [];
  if (partySelect) partySelect.innerHTML = '<option value="">Sem party</option>' + parties.map(p => `<option value="${esc(p.id)}">${esc(p.name)}</option>`).join("");
}

async function loadCharacters() {
  const { data, error } = await supabase.from("characters").select("*").order("name");
  if (error) throw new Error(`Falha ao carregar personagens: ${error.message}`);
  characters = data || [];
  renderCharacters();
}

function renderCharacters() {
  if (!characters.length) { characterList.innerHTML = "<p>Nenhum personagem registrado.</p>"; return; }
  characterList.innerHTML = characters.map(c => {
    const owner = profiles.find(p => p.id === c.owner_id);
    const party = parties.find(p => p.id === c.clan_id);
    const ownerName = owner?.display_name || owner?.username || "Jogador não identificado";
    const avatar = avatarHTML(c.name, c.portrait_url, `Retrato de ${c.name}`);
    const adminActions = isAdmin ? `<div class="character-card-actions"><button class="button button-small" type="button" data-edit="${esc(c.id)}">Editar</button><button class="button button-small" type="button" data-delete="${esc(c.id)}">Excluir</button></div>` : "";
    return `<article class="player-card character-mini-card"><div class="avatar">${avatar}</div><div class="character-mini-info"><h3>${esc(c.name)}</h3><p>Player: ${esc(ownerName)}</p>${party ? `<p>Party: ${esc(party.name)}</p>` : ""}${Number(c.points || 0) ? `<p>${Number(c.points)} pts</p>` : ""}${adminActions}</div></article>`;
  }).join("");
}

function resetForm() { form?.reset(); if (!form) return; form.elements.id.value=""; form.elements.level.value=1; if(form.elements.points) form.elements.points.value=0; form.elements.status.value="pending"; formTitle.textContent="Novo personagem"; cancelButton.hidden=true; setStatus(message,""); }
function editCharacter(id) { const c=characters.find(x=>x.id===id); if(!c||!form)return; for (const [k,v] of Object.entries({id:c.id,name:c.name,nickname:c.nickname,owner_id:c.owner_id,description:c.description,portrait_url:c.portrait_url,ficha_url:c.ficha_url,level:c.level,notoriety:c.notoriety,reputation:c.reputation,points:c.points??0,clan_id:c.clan_id,status:c.status})) if(form.elements[k]) form.elements[k].value=v??""; formTitle.textContent="Editar personagem"; cancelButton.hidden=false; form.scrollIntoView({behavior:"smooth"}); }
async function deleteCharacter(id) { const c=characters.find(x=>x.id===id); if(!c||!confirm(`Deseja excluir o personagem "${c.name}"?`))return; const {error}=await supabase.from("characters").delete().eq("id",id); if(error)return setStatus(message,error.message,"error"); await loadCharacters(); }

form?.addEventListener("submit", async e => { e.preventDefault(); const fd=new FormData(form), id=String(fd.get("id")||""); const payload={name:String(fd.get("name")||"").trim(),nickname:String(fd.get("nickname")||"").trim()||null,owner_id:String(fd.get("owner_id")||""),description:String(fd.get("description")||"").trim()||null,portrait_url:String(fd.get("portrait_url")||"").trim()||null,ficha_url:String(fd.get("ficha_url")||"").trim()||null,level:Number(fd.get("level")||1),notoriety:String(fd.get("notoriety")||"").trim()||null,reputation:String(fd.get("reputation")||"").trim()||null,points:Number(fd.get("points")||0),clan_id:String(fd.get("clan_id")||"")||null,status:String(fd.get("status")||"pending")}; if(!payload.name||!payload.owner_id)return setStatus(message,"Preencha nome e jogador responsável.","error"); setStatus(message,"Salvando personagem..."); const result=id?await supabase.from("characters").update(payload).eq("id",id):await supabase.from("characters").insert(payload); if(result.error)return setStatus(message,result.error.message,"error"); setStatus(message,"Personagem salvo com sucesso.","success"); resetForm(); await loadCharacters(); });
cancelButton?.addEventListener("click",resetForm);
characterList?.addEventListener("click",async e=>{const eb=e.target.closest("[data-edit]"),db=e.target.closest("[data-delete]");if(eb)editCharacter(eb.dataset.edit);if(db)await deleteCharacter(db.dataset.delete);});

async function init(){ try { const {data:{user}}=await supabase.auth.getUser(); isAdmin=user?.id===ADMIN_UID; if(isAdmin){adminArea.hidden=false;accessMessage.hidden=true;} else {adminArea.hidden=true;accessMessage.hidden=true;} await loadProfiles(); await loadParties(); await loadCharacters(); } catch(error){ characterList.innerHTML=`<p class="status error">Não foi possível carregar o acervo: ${esc(error.message)}</p>`; } }
init();
