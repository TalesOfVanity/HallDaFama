import { supabase } from "./supabase.js";
import { escapeHTML, formatDate, getQueryParam, avatarHTML, setStatus } from "./utils.js";
import { badgeFrame, badgeExp, rarityInfo } from "./badges.js";

const root = document.querySelector("#player-profile");
const requestedId = getQueryParam("id");
const requestedUsername = (getQueryParam("u") || "").replace(/^@/, "").toLowerCase();
let viewer = null;
let player = null;
let isAdmin = false;
let characters = [];
let posts = [];
let activeTab = "personal";

const participationLabel = value => ({ interpreter:"Intérprete", narrator:"Narrador", both:"Intérprete & Narrador" }[value] || "Intérprete");

function safeExternalUrl(value="") {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? url.href : "";
  } catch { return ""; }
}

function linkifyMentions(text="") {
  const escaped = escapeHTML(text);
  return escaped.replace(/(^|[^\w])@([a-z0-9._-]{3,30})/gi, (full, before, username) =>
    `${before}<a class="mention-link" href="jogador.html?u=${encodeURIComponent(username.toLowerCase())}">@${escapeHTML(username)}</a>`
  ).replace(/\n/g, "<br>");
}

async function resolvePlayer() {
  let query = supabase.from("profiles").select("*");
  if (requestedUsername) query = query.ilike("username", requestedUsername);
  else if (requestedId) query = query.eq("id", requestedId);
  else return null;
  const { data, error } = await query.single();
  if (error) return null;
  return data;
}

async function loadViewer() {
  const { data:{ user } } = await supabase.auth.getUser();
  viewer = user || null;
  if (!viewer) return;
  const { data } = await supabase.from("profiles").select("role, active").eq("id", viewer.id).maybeSingle();
  isAdmin = data?.role === "admin";
}

async function loadRelated() {
  const [badgeResult, characterResult, postResult] = await Promise.all([
    supabase.from("player_badges").select(`awarded_at, rarity, progress_value, badges ( id, name, description, icon, rarity, category, is_mvp, exp_multiplier, progression_mode, progression_steps )`).eq("player_id", player.id).order("awarded_at", { ascending:false }),
    supabase.from("characters").select("id,name,nickname,portrait_url,ficha_url,level,status").eq("owner_id", player.id).eq("status", "approved").order("name"),
    supabase.from("profile_posts").select(`id, author_id, profile_id, post_type, content, created_at, updated_at, author:profiles!profile_posts_author_id_fkey(id, display_name, username, avatar_url), images:profile_post_images(id, storage_path, public_url, position)`).eq("profile_id", player.id).order("created_at", { ascending:false })
  ]);
  characters = characterResult.data || [];
  posts = postResult.data || [];
  return badgeResult.data || [];
}

function characterCard(c) {
  const name = c.name || "Personagem";
  const link = safeExternalUrl(c.ficha_url);
  return `<article class="profile-character-card">
    <div class="avatar profile-character-avatar">${avatarHTML(name, c.portrait_url, `Retrato de ${name}`)}</div>
    <div class="profile-character-info"><h3>${escapeHTML(name)}</h3>${c.nickname?`<p>${escapeHTML(c.nickname)}</p>`:""}<span>Nível ${Number(c.level||1)}</span></div>
    ${link ? `<a class="button button-small" href="${escapeHTML(link)}" target="_blank" rel="noopener noreferrer">Abrir ficha ↗</a>` : `<span class="profile-no-sheet">Sem ficha vinculada</span>`}
  </article>`;
}

function postCard(post) {
  const author = post.author || {};
  const authorName = author.display_name || author.username || "Jogador";
  const canDelete = !!viewer && (viewer.id === post.author_id || viewer.id === player.id || isAdmin);
  const imgs = [...(post.images || [])].sort((a,b)=>(a.position||0)-(b.position||0));
  return `<article class="profile-post" data-post-id="${post.id}">
    <header class="profile-post-head">
      <a class="profile-post-author" href="jogador.html?u=${encodeURIComponent(author.username || "")}">
        <span class="avatar profile-post-avatar">${avatarHTML(authorName, author.avatar_url, `Foto de ${authorName}`)}</span>
        <span><strong>${escapeHTML(authorName)}</strong>${author.username?`<small>@${escapeHTML(author.username)}</small>`:""}</span>
      </a>
      <div class="profile-post-actions"><time>${formatDate(post.created_at)}</time>${canDelete?`<button class="post-delete" type="button" data-delete-post="${post.id}" title="Apagar publicação">Apagar</button>`:""}</div>
    </header>
    ${post.content ? `<div class="profile-post-content">${linkifyMentions(post.content)}</div>` : ""}
    ${imgs.length ? `<div class="profile-post-gallery gallery-${Math.min(imgs.length,4)}">${imgs.map(img=>`<a href="${escapeHTML(img.public_url)}" target="_blank" rel="noopener"><img src="${escapeHTML(img.public_url)}" alt="Imagem da publicação" loading="lazy"></a>`).join("")}</div>` : ""}
  </article>`;
}

function composer(type) {
  if (!viewer) return `<div class="profile-feed-note">Entre na sua conta para publicar.</div>`;
  if (type === "personal" && viewer.id !== player.id) return "";
  return `<form class="profile-composer" data-composer="${type}">
    <textarea name="content" rows="5" maxlength="10000" placeholder="${type === "personal" ? "Registre uma descrição, skill, item, cena, conquista ou qualquer parte da sua jornada..." : `Escreva algo no mural de ${escapeHTML(player.display_name || player.username || "jogador")}...`}"></textarea>
    <div class="profile-composer-row"><label class="image-picker">Adicionar fotos <input name="images" type="file" accept="image/png,image/jpeg,image/webp,image/gif" multiple></label><span>Até 4 imagens · 5 MB cada</span><button class="button" type="submit">Publicar</button></div>
    <p class="status" data-post-status></p>
  </form>`;
}

function renderFeed() {
  const panel = document.querySelector("#profile-feed-panel");
  if (!panel) return;
  const filtered = posts.filter(p => p.post_type === activeTab);
  panel.innerHTML = `${composer(activeTab)}<div class="profile-post-list">${filtered.map(postCard).join("") || `<div class="profile-feed-empty">${activeTab === "personal" ? "Nenhuma publicação ainda." : "O mural ainda está vazio."}</div>`}</div>`;
  bindFeedEvents();
}

function bindFeedEvents() {
  document.querySelectorAll("[data-composer]").forEach(form => form.addEventListener("submit", submitPost));
  document.querySelectorAll("[data-delete-post]").forEach(btn => btn.addEventListener("click", deletePost));
}

async function submitPost(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const status = form.querySelector("[data-post-status]");
  const type = form.dataset.composer;
  const content = form.content.value.trim();
  const files = [...form.images.files].slice(0,4);
  if (!content && !files.length) return setStatus(status, "Escreva algo ou adicione uma imagem.", "error");
  if ([...form.images.files].length > 4) return setStatus(status, "Você pode adicionar no máximo 4 imagens.", "error");
  if (files.some(f => f.size > 5 * 1024 * 1024)) return setStatus(status, "Cada imagem pode ter no máximo 5 MB.", "error");
  setStatus(status, "Publicando...");

  const { data:post, error } = await supabase.from("profile_posts").insert({ author_id:viewer.id, profile_id:player.id, post_type:type, content:content || null }).select("id").single();
  if (error) return setStatus(status, error.message, "error");

  const imageRows = [];
  for (let i=0;i<files.length;i++) {
    const file = files[i];
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
    const path = `${viewer.id}/${post.id}/${crypto.randomUUID()}.${ext}`;
    const upload = await supabase.storage.from("profile-posts").upload(path, file, { upsert:false, contentType:file.type });
    if (upload.error) { setStatus(status, `Publicação criada, mas uma imagem falhou: ${upload.error.message}`, "error"); continue; }
    const { data:urlData } = supabase.storage.from("profile-posts").getPublicUrl(path);
    imageRows.push({ post_id:post.id, storage_path:path, public_url:urlData.publicUrl, position:i });
  }
  if (imageRows.length) await supabase.from("profile_post_images").insert(imageRows);
  form.reset();
  await refreshPosts();
}

async function deletePost(event) {
  const id = event.currentTarget.dataset.deletePost;
  if (!confirm("Apagar esta publicação?")) return;
  const post = posts.find(p => String(p.id) === String(id));
  const { error } = await supabase.from("profile_posts").delete().eq("id", id);
  if (error) return alert(error.message);
  // O autor consegue remover os próprios arquivos; quando dono do mural/admin apaga post alheio,
  // a referência some imediatamente e uma limpeza de Storage pode ser feita depois.
  if (post?.author_id === viewer?.id && post.images?.length) {
    await supabase.storage.from("profile-posts").remove(post.images.map(x=>x.storage_path));
  }
  await refreshPosts();
}

async function refreshPosts() {
  const { data } = await supabase.from("profile_posts").select(`id, author_id, profile_id, post_type, content, created_at, updated_at, author:profiles!profile_posts_author_id_fkey(id, display_name, username, avatar_url), images:profile_post_images(id, storage_path, public_url, position)`).eq("profile_id", player.id).order("created_at", { ascending:false });
  posts = data || [];
  renderFeed();
}

async function loadPlayer() {
  await loadViewer();
  player = await resolvePlayer();
  if (!player || player.active === false) { root.innerHTML='<p class="status error">Jogador não encontrado.</p>'; return; }
  const items = await loadRelated();
  const name = player.display_name || player.username || "Jogador";
  const mvp = items.find(x=>x.badges?.is_mvp);
  const totalExp = items.reduce((s,x)=>s+badgeExp(x.badges,x),0);
  const canonical = player.username ? `jogador.html?u=${encodeURIComponent(player.username)}` : `jogador.html?id=${encodeURIComponent(player.id)}`;
  if (player.username && !requestedUsername) history.replaceState(null,"",canonical);

  root.innerHTML=`
  <section class="profile-hero profile-hero-social"><div class="avatar avatar-large">${avatarHTML(name, player.avatar_url, `Foto de ${name}`)}</div><div class="profile-hero-main"><span class="eyebrow">Perfil de jogador</span><h1 class="profile-name-with-mvp">${escapeHTML(name)} ${mvp?`<span class="mvp-name-icon mvp-name-icon-large" title="MVP">${mvp.badges.icon?`<img src="${escapeHTML(mvp.badges.icon)}" alt="MVP">`:"◆"}</span>`:""}</h1>${player.username?`<a class="profile-username" href="${canonical}">@${escapeHTML(player.username)}</a>`:""}<p>${escapeHTML(player.bio||"Nenhuma biografia registrada.")}</p><div class="player-status-tags"><span class="status-tag">${participationLabel(player.participation_type)}</span>${player.role==="admin"?'<span class="status-tag admin-tag">Admin</span>':""}</div><div class="meta"><span>${escapeHTML(player.country||"—")}</span><span>Desde ${formatDate(player.created_at)}</span><span>${totalExp} EXP</span><span>${items.length} Brasões</span><span>${characters.length} Personagens</span></div></div></section>

  <section class="section"><div class="section-heading"><span class="eyebrow">Arquivo pessoal</span><h2>Personagens</h2></div><div class="profile-character-grid">${characters.map(characterCard).join("") || '<p class="profile-feed-empty">Nenhum personagem registrado.</p>'}</div></section>

  <section class="section"><div class="section-heading"><span class="eyebrow">Insígnias</span><h2>Brasões conquistados</h2></div><div class="badge-grid">${items.map(item=>{const b=item.badges,r=rarityInfo(item.rarity);return `<article class="badge-card badge-card-tier">${badgeFrame(b,item)}<div><h3>${escapeHTML(b?.name||"Insígnia")}</h3><p>${escapeHTML(b?.description||"")}</p><div class="badge-meta">${b?.is_mvp?'<span class="status-tag mvp-tag">MVP</span>':`<span class="status-tag">${escapeHTML(r.label)}</span><strong>${badgeExp(b,item)} EXP</strong>`}</div></div></article>`}).join("")||'<p>Nenhuma insígnia conquistada.</p>'}</div></section>

  <section class="section profile-social-section"><div class="section-heading"><span class="eyebrow">Crônicas do perfil</span><h2>Publicações & Mural</h2></div><div class="profile-feed-tabs"><button class="profile-feed-tab active" data-feed-tab="personal" type="button">Publicações <span>${posts.filter(p=>p.post_type==='personal').length}</span></button><button class="profile-feed-tab" data-feed-tab="wall" type="button">Mural <span>${posts.filter(p=>p.post_type==='wall').length}</span></button></div><div id="profile-feed-panel"></div></section>`;

  document.querySelectorAll("[data-feed-tab]").forEach(btn=>btn.addEventListener("click",()=>{activeTab=btn.dataset.feedTab;document.querySelectorAll("[data-feed-tab]").forEach(x=>x.classList.toggle("active",x===btn));renderFeed();}));
  renderFeed();
}
loadPlayer();
