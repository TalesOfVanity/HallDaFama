import{ supabase }from'./supabase.js';import{escapeHTML,avatarHTML,formatDate}from'./utils.js';const e=v=>escapeHTML(String(v??''));
async function featuredPlayers(){const{data}=await supabase.from('profiles').select('id,username,display_name,avatar_url,country,participation_type').eq('active',true).eq('listed',true).limit(3);document.querySelector('#featured-players').innerHTML=(data||[]).map(p=>`<a class="player-card" href="/jogador?u=${encodeURIComponent(p.username||'')}"><div class="avatar">${avatarHTML(p.display_name||p.username,p.avatar_url,'')}</div><div><strong>${e(p.display_name||p.username)}</strong><span>${p.username?'@'+e(p.username):''}</span></div></a>`).join('')||'<p class="profile-feed-empty">Nenhum jogador em destaque.</p>'}
async function events(){const{data}=await supabase.from('chronicle_events').select('id,title,summary,event_date,season_id').order('event_date',{ascending:false}).limit(4);document.querySelector('#home-events').innerHTML=(data||[]).map(x=>`<a class="home-event" href="/episodio?id=${x.id}"><time>${x.event_date?new Date(x.event_date+'T12:00:00').toLocaleDateString('pt-BR'):''}</time><strong>${e(x.title)}</strong><span>${e(x.summary||'')}</span></a>`).join('')||'<p class="profile-feed-empty">Nenhum acontecimento publicado.</p>'}
const UUID_RE=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const validUuid=v=>UUID_RE.test(String(v||''));
function activityEntityId(row,keys=[]){
  const candidates=[row?.entity_id,...keys.map(k=>row?.metadata?.[k])];
  try{const url=new URL(row?.target_url||'',location.href);candidates.push(url.searchParams.get('id'))}catch{}
  return candidates.find(validUuid)||null;
}
async function existingIds(table,ids,extra=null){
  const clean=[...new Set(ids.filter(validUuid))];
  if(!clean.length)return new Set();
  let q=supabase.from(table).select('id').in('id',clean);
  if(extra)q=extra(q);
  const{data,error}=await q;
  if(error){console.warn(`[Atividade] Falha ao validar ${table}:`,error.message);return null}
  return new Set((data||[]).map(x=>x.id));
}
async function filterLiveActivity(rows){
  const refs=rows.map(row=>{
    if(['character_created','character_level'].includes(row.event_type))return{row,kind:'character',id:activityEntityId(row,['character_id'])};
    if(row.event_type==='relation_confirmed')return{row,kind:'relation',id:activityEntityId(row,['relation_id'])};
    if(row.event_type==='party_created')return{row,kind:'party',id:activityEntityId(row,['party_id','clan_id'])};
    if(row.event_type==='chronicle_published')return{row,kind:'episode',id:activityEntityId(row,['event_id','episode_id','chronicle_id'])};
    if(row.event_type==='profile_post')return{row,kind:'post',id:activityEntityId(row,['post_id'])};
    return{row,kind:null,id:null};
  });
  const ids=kind=>refs.filter(x=>x.kind===kind&&x.id).map(x=>x.id);
  const[characters,relations,partys,episodes,posts]=await Promise.all([
    existingIds('characters',ids('character'),q=>q.eq('status','approved')),
    existingIds('character_relations',ids('relation'),q=>q.eq('status','confirmed')),
    existingIds('clans',ids('party')),
    existingIds('timeline_events',ids('episode'),q=>q.eq('published',true)),
    existingIds('profile_posts',ids('post'))
  ]);
  const sets={character:characters,relation:relations,party:partys,episode:episodes,post:posts};
  return refs.filter(({kind,id})=>{
    if(!kind||!id)return true; // Eventos puramente históricos continuam válidos.
    const set=sets[kind];
    return set===null?true:set.has(id); // Falha de rede não deve apagar visualmente o feed.
  }).map(x=>x.row);
}
async function activity(){
  const root=document.querySelector('#recent-activity');
  const{data,error}=await supabase.from('activity_events').select('*').eq('visible',true).order('created_at',{ascending:false}).limit(40);
  if(error){root.innerHTML='<p class="profile-feed-empty">A atividade recente está temporariamente indisponível.</p>';return}
  const rows=await filterLiveActivity(data||[]);
  const labels={badge_earned:'✦',character_created:'♙',character_level:'↑',party_joined:'♜',party_created:'♜',chronicle_published:'◇',relation_confirmed:'↔',relation_ended:'×',profile_post:'✎',milestone:'★',system:'•'};
  root.innerHTML=rows.slice(0,8).map(x=>`<${x.target_url?'a':'div'} class="activity-item" ${x.target_url?`href="${e(x.target_url)}"`:''}><span class="activity-mark">${labels[x.event_type]||'•'}</span><div>${x.message?e(x.message):`<strong>${e(x.title||'Novo acontecimento')}</strong>`}<small>${formatDate(x.created_at)}</small></div></${x.target_url?'a':'div'}>`).join('')||'<p class="profile-feed-empty">A história está esperando o próximo capítulo.</p>';
}
async function highlights(){const root=document.querySelector('#portal-highlights');const{data,error}=await supabase.from('featured_content').select('*').eq('active',true).order('position').limit(6);if(error){root.innerHTML='<p class="profile-feed-empty">Os destaques ainda não foram configurados.</p>';return}root.innerHTML=(data||[]).map(x=>`<a class="highlight-card" href="${e(x.target_url||'#')}">${x.image_url?`<img src="${e(x.image_url)}" alt="">`:''}<span class="eyebrow">${e(({character:'Personagem',party:'Party',chronicle:'Episódio',player:'Jogador'}[x.content_type])||'Destaque')}</span><h3>${e(x.title)}</h3><p>${e(x.subtitle||'')}</p></a>`).join('')||'<p class="profile-feed-empty">Nenhum destaque editorial no momento.</p>'}
document.querySelector('#random-character')?.addEventListener('click',async()=>{const{data}=await supabase.from('characters').select('id').eq('status','approved').limit(500);if(data?.length)location.href=`/personagem?id=${data[Math.floor(Math.random()*data.length)].id}`});Promise.allSettled([featuredPlayers(),events(),activity(),highlights()]);
