import { supabase } from "./supabase.js";
import { escapeHTML } from "./utils.js";
import { icon } from "./icons.js";
const e=v=>escapeHTML(String(v??''));
let timer;
function group(title,rows,render){return rows?.length?`<section class="global-search-group"><h3>${title}</h3>${rows.map(render).join('')}</section>`:''}
async function runSearch(q,results){
 const s=q.trim(); if(s.length<2){results.innerHTML='<p class="global-search-hint">Digite pelo menos 2 caracteres para pesquisar jogadores, personagens, partys e crônicas.</p>';return}
 results.innerHTML='<p class="global-search-hint">Pesquisando no Acervo...</p>';
 const like=`%${s}%`;
 const [p,c,g,ch]=await Promise.all([
  supabase.from('profiles').select('id,display_name,username,avatar_url').eq('active',true).or(`display_name.ilike.${like},username.ilike.${like}`).limit(5),
  supabase.from('characters').select('id,name,nickname,portrait_url').eq('status','approved').or(`name.ilike.${like},nickname.ilike.${like}`).limit(6),
  supabase.from('clans').select('id,name,acronym,emblem_url').or(`name.ilike.${like},acronym.ilike.${like}`).limit(5),
  supabase.from('timeline_events').select('id,title,summary').or(`title.ilike.${like},summary.ilike.${like}`).limit(5)
 ]);
 const html=group('Jogadores',p.data,x=>`<a href="jogador.html?u=${encodeURIComponent(x.username||'')}"><strong>${e(x.display_name||x.username)}</strong><span>${x.username?'@'+e(x.username):''}</span></a>`)+group('Personagens',c.data,x=>`<a href="personagem.html?id=${x.id}"><strong>${e(x.name)}</strong><span>${e(x.nickname||'')}</span></a>`)+group('Partys',g.data,x=>`<a href="clans.html#${x.id}"><strong>${e(x.name)}</strong><span>${e(x.acronym||'')}</span></a>`)+group('Episódios',ch.data,x=>`<a href="evento.html?id=${x.id}"><strong>${e(x.title)}</strong><span>${e((x.summary||'').slice(0,90))}</span></a>`);
 results.innerHTML=html||'<p class="global-search-hint">Nenhum resultado encontrado.</p>';
}
export function initGlobalSearch(){
 if(document.querySelector('#global-search-modal'))return;
 const nav=document.querySelector('.nav-links'); if(!nav)return;
 const auth=nav.querySelector('[data-auth-area]');
 const btn=document.createElement('button');btn.type='button';btn.className='nav-search-button';btn.innerHTML=`${icon('search','Pesquisar')}<span>Pesquisar</span>`;btn.setAttribute('aria-label','Pesquisar no Acervo');
 nav.insertBefore(btn,auth);
 const modal=document.createElement('div');modal.id='global-search-modal';modal.className='global-search-backdrop';modal.hidden=true;modal.innerHTML=`<div class="global-search-panel" role="dialog" aria-modal="true" aria-label="Busca Global"><div class="global-search-input-row">${icon('search','')}<input id="global-search-input" autocomplete="off" placeholder="Pesquisar no Acervo..." aria-label="Pesquisar"><button type="button" class="global-search-close" aria-label="Fechar">×</button></div><div id="global-search-results" class="global-search-results"><p class="global-search-hint">Pesquise jogadores, personagens, partys e crônicas.</p></div><footer><span>Busca Global</span><span><kbd>Esc</kbd> para fechar</span></footer></div>`;document.body.appendChild(modal);
 const input=modal.querySelector('#global-search-input'),results=modal.querySelector('#global-search-results');
 const open=()=>{modal.hidden=false;document.body.classList.add('modal-open');setTimeout(()=>input.focus(),0)};
 const close=()=>{modal.hidden=true;document.body.classList.remove('modal-open')};
 btn.onclick=open;modal.querySelector('.global-search-close').onclick=close;modal.onclick=ev=>{if(ev.target===modal)close()};
 input.oninput=()=>{clearTimeout(timer);timer=setTimeout(()=>runSearch(input.value,results),180)};
 document.addEventListener('keydown',ev=>{if((ev.ctrlKey||ev.metaKey)&&ev.key.toLowerCase()==='k'){ev.preventDefault();modal.hidden?open():close()}else if(ev.key==='Escape'&&!modal.hidden)close()});
}
