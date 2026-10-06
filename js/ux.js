// Tales of Vanity 6.0 — camada global de UX e acessibilidade.
import { icon } from './icons.js';
import { supabase } from './supabase.js';



// Tales of Vanity 9.3.1 — preferência de aparência (Sistema / Claro / Escuro).
const THEME_KEY='tov-theme';
function savedTheme(){try{const v=localStorage.getItem(THEME_KEY);return ['light','dark'].includes(v)?v:'system'}catch{return 'system'}}
function effectiveTheme(pref=savedTheme()){return pref==='system'?(matchMedia('(prefers-color-scheme: light)').matches?'light':'dark'):pref}
function applyTheme(pref=savedTheme()){
  if(pref==='system') document.documentElement.removeAttribute('data-theme');
  else document.documentElement.dataset.theme=pref;
  document.documentElement.dataset.themePreference=pref;
  document.querySelectorAll('.theme-menu button[data-theme-choice]').forEach(b=>b.setAttribute('aria-checked',String(b.dataset.themeChoice===pref)));
  document.querySelectorAll('.theme-toggle').forEach(b=>{const e=effectiveTheme(pref);b.textContent=e==='light'?'☀':'☾';b.title=`Aparência: ${pref==='system'?'Sistema':pref==='light'?'Claro':'Escuro'}`});
}
function themeControl(){
  const nav=document.querySelector('.nav-links');if(!nav||nav.querySelector('.theme-control'))return;
  const auth=nav.querySelector('[data-auth-area]');const wrap=document.createElement('div');wrap.className='theme-control';
  wrap.innerHTML=`<button type="button" class="theme-toggle" aria-label="Alterar aparência" aria-expanded="false"></button><div class="theme-menu" role="radiogroup" aria-label="Aparência"><button type="button" role="radio" data-theme-choice="system">Sistema</button><button type="button" role="radio" data-theme-choice="light">Claro</button><button type="button" role="radio" data-theme-choice="dark">Escuro</button></div>`;
  nav.insertBefore(wrap,auth||null);const toggle=wrap.querySelector('.theme-toggle');
  toggle.addEventListener('click',e=>{e.stopPropagation();const open=wrap.classList.toggle('open');toggle.setAttribute('aria-expanded',String(open))});
  wrap.querySelectorAll('[data-theme-choice]').forEach(b=>b.addEventListener('click',()=>{const pref=b.dataset.themeChoice;try{pref==='system'?localStorage.removeItem(THEME_KEY):localStorage.setItem(THEME_KEY,pref)}catch{}applyTheme(pref);wrap.classList.remove('open');toggle.setAttribute('aria-expanded','false')}));
  document.addEventListener('click',e=>{if(!wrap.contains(e.target)){wrap.classList.remove('open');toggle.setAttribute('aria-expanded','false')}});
  applyTheme();
}
const themeMedia=matchMedia('(prefers-color-scheme: light)');themeMedia.addEventListener?.('change',()=>{if(savedTheme()==='system')applyTheme('system')});
applyTheme();

const actionIcons = [
  [/^salvar\b/i,'save'],[/^editar\b/i,'pencil'],[/^excluir\b|^remover\b/i,'trash'],
  [/^aprovar\b/i,'check'],[/^recusar\b|^rejeitar\b/i,'xCircle'],[/^cancelar\b|^fechar\b/i,'x'],
  [/^buscar\b|^pesquisar\b/i,'search'],[/^filtrar\b/i,'filter'],[/^criar\b|^novo\b|^nova\b|^registrar\b|^adicionar\b/i,'plus'],
  [/^favoritar\b/i,'bookmark'],[/^ver ficha\b|^abrir\b/i,'externalLink'],[/^voltar\b/i,'arrowLeft'],
  [/^gerenciar brasões\b|^atribuir brasão\b/i,'award'],[/^enviar\b|^publicar\b/i,'send']
];

function enhanceButtons(){
  document.querySelectorAll('button.button, a.button').forEach(el=>{
    if(el.querySelector('.ui-icon') || el.dataset.noIcon!==undefined) return;
    const label=(el.textContent||'').trim();
    const match=actionIcons.find(([rx])=>rx.test(label));
    if(!match) return;
    el.insertAdjacentHTML('afterbegin', icon(match[1]));
    el.classList.add('button-with-icon');
  });
}
function enhanceForms(){
  document.querySelectorAll('input,select,textarea').forEach((field,i)=>{
    if(!field.id) field.id=`field-${i}-${Math.random().toString(36).slice(2,7)}`;
    const wrap=field.closest('.field');
    const label=wrap?.querySelector(':scope > label');
    if(label && !label.htmlFor && !label.querySelector('input')) label.htmlFor=field.id;
    if(field.required){ field.setAttribute('aria-required','true'); if(label && !label.querySelector('.required-mark')) label.insertAdjacentHTML('beforeend',' <span class="required-mark" aria-hidden="true">*</span>'); }
  });
  document.querySelectorAll('form').forEach(form=>form.addEventListener('submit',()=>{
    const btn=form.querySelector('button[type="submit"]'); if(!btn || btn.disabled) return;
    btn.classList.add('is-busy'); btn.setAttribute('aria-busy','true');
    setTimeout(()=>{btn.classList.remove('is-busy');btn.removeAttribute('aria-busy')},4500);
  }));
}
function activeNavigation(){
  const current=(location.pathname.split('/').pop()||'index.html').toLowerCase();
  document.querySelectorAll('.nav-links a[href]').forEach(a=>{ if((a.getAttribute('href')||'').split('?')[0].toLowerCase()===current){a.classList.add('is-current');a.setAttribute('aria-current','page')} });
}
function enhanceTables(){document.querySelectorAll('table').forEach(t=>{if(t.parentElement?.classList.contains('table-scroll'))return;const w=document.createElement('div');w.className='table-scroll';t.parentNode.insertBefore(w,t);w.appendChild(t)})}
function enhanceExternalLinks(){document.querySelectorAll('a[target="_blank"]').forEach(a=>{a.rel='noopener noreferrer';if(!a.querySelector('.ui-icon'))a.insertAdjacentHTML('beforeend',icon('externalLink'))})}
function enhanceEmptyStates(){document.querySelectorAll('.profile-feed-empty,.empty-state').forEach(el=>{el.classList.add('ux-empty-state');if(!el.querySelector('.ui-icon'))el.insertAdjacentHTML('afterbegin',icon('archive'))})}
function toast(message,type='info'){
  let region=document.querySelector('.toast-region');if(!region){region=document.createElement('div');region.className='toast-region';region.setAttribute('aria-live','polite');region.setAttribute('aria-atomic','true');document.body.append(region)}
  const el=document.createElement('div');el.className=`toast toast-${type}`;el.innerHTML=`${icon(type==='success'?'check':type==='error'?'xCircle':'sparkles')}<span></span>`;el.querySelector('span').textContent=message;region.append(el);requestAnimationFrame(()=>el.classList.add('show'));setTimeout(()=>{el.classList.remove('show');setTimeout(()=>el.remove(),220)},3600)
}
window.tovToast=toast;
// Alertas existentes passam a usar feedback não-bloqueante sem reescrever cada módulo.
const nativeAlert=window.alert.bind(window);window.alert=(message)=>{if(document.body)toast(String(message),/erro|falh|invál|não foi possível/i.test(String(message))?'error':/salv|envi|criad|atualiz|sucesso|aprov/i.test(String(message))?'success':'info');else nativeAlert(message)};

function breadcrumbs(){
  const main=document.querySelector('main.container, main > .container'); if(!main || document.body.classList.contains('home-page')) return;
  const heading=main.querySelector('h1'); if(!heading || main.querySelector('.ux-breadcrumbs')) return;
  const page=(heading.textContent||document.title.split('—')[0]).trim();
  const nav=document.createElement('nav');nav.className='ux-breadcrumbs';nav.setAttribute('aria-label','Navegação estrutural');nav.innerHTML=`<a href="index.html">Início</a><span aria-hidden="true">›</span><span aria-current="page"></span>`;nav.lastElementChild.textContent=page;main.insertBefore(nav,main.firstChild)
}
function mobileNav(){
 const nav=document.querySelector('.nav');const links=document.querySelector('.nav-links');if(!nav||!links||nav.querySelector('.mobile-nav-toggle'))return;
 const b=document.createElement('button');b.type='button';b.className='mobile-nav-toggle';b.setAttribute('aria-label','Abrir menu de navegação');b.setAttribute('aria-expanded','false');b.innerHTML=icon('menu');const close=()=>{nav.classList.remove('mobile-open');document.body.classList.remove('nav-locked');b.setAttribute('aria-expanded','false');b.setAttribute('aria-label','Abrir menu de navegação');b.innerHTML=icon('menu')};b.onclick=()=>{const open=!nav.classList.contains('mobile-open');if(open){nav.classList.add('mobile-open');document.body.classList.add('nav-locked');b.setAttribute('aria-expanded','true');b.setAttribute('aria-label','Fechar menu de navegação');b.innerHTML=icon('x')}else close()};links.addEventListener('click',e=>{if(e.target.closest('a')&&innerWidth<=820)close()});addEventListener('resize',()=>{if(innerWidth>820)close()});document.addEventListener('keydown',e=>{if(e.key==='Escape'&&nav.classList.contains('mobile-open'))close()});nav.insertBefore(b,links)
}


const MEDIA_FIELDS = new Set(['avatar_url','portrait_url','banner_url','cover_url','image_url']);
function mediaKind(input){return (input.name||input.id||'image').replace(/_url$/,'').replace(/[^a-z0-9_-]/gi,'-').toLowerCase()}
function enhanceMediaUploads(root=document){
  root.querySelectorAll?.('input[type="url"],input[name$="_url"]').forEach(input=>{
    if(input.dataset.mediaEnhanced || !MEDIA_FIELDS.has(input.name||'')) return;
    input.dataset.mediaEnhanced='true';
    const box=document.createElement('div');box.className='media-upload';
    const picker=document.createElement('div');picker.className='media-upload-picker';picker.innerHTML=`${icon('image')}<span><strong>Escolher imagem</strong><small>JPG, PNG ou WebP · até 5 MB</small></span><button type="button" class="media-upload-button">Selecionar</button><input type="file" accept="image/jpeg,image/png,image/webp" hidden>`;
    const preview=document.createElement('div');preview.className='media-upload-preview';preview.hidden=true;
    const divider=document.createElement('span');divider.className='media-upload-divider';divider.textContent='ou use uma URL externa';
    input.parentNode.insertBefore(box,input);box.append(picker,preview,divider,input);
    const file=picker.querySelector('input[type=file]');picker.querySelector('.media-upload-button')?.addEventListener('click',()=>file.click());
    const show=url=>{preview.innerHTML=url?`<img src="${String(url).replace(/"/g,'&quot;')}" alt="Pré-visualização"><button type="button" class="media-upload-clear">Remover</button>`:'';preview.hidden=!url;preview.querySelector('button')?.addEventListener('click',()=>{input.value='';file.value='';preview.hidden=true;preview.innerHTML='';input.dispatchEvent(new Event('input',{bubbles:true}))})};
    if(input.value) show(input.value);
    input.addEventListener('change',()=>show(input.value.trim()));
    file.addEventListener('change',async()=>{
      const f=file.files?.[0];if(!f)return;
      if(!['image/jpeg','image/png','image/webp'].includes(f.type)){toast('Formato não suportado. Use JPG, PNG ou WebP.','error');file.value='';return}
      if(f.size>5*1024*1024){toast('A imagem deve ter no máximo 5 MB.','error');file.value='';return}
      const {data:{user}}=await supabase.auth.getUser();if(!user){toast('Entre na sua conta para enviar imagens.','error');file.value='';return}
      picker.classList.add('is-uploading');picker.querySelector('strong').textContent='Enviando...';
      try{
        const ext=(f.name.split('.').pop()||'jpg').toLowerCase().replace(/[^a-z0-9]/g,'');
        const path=`${user.id}/${mediaKind(input)}/${crypto.randomUUID()}.${ext}`;
        const {error}=await supabase.storage.from('tov-media').upload(path,f,{cacheControl:'31536000',upsert:false,contentType:f.type});if(error)throw error;
        const {data}=supabase.storage.from('tov-media').getPublicUrl(path);input.value=data.publicUrl;input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));show(data.publicUrl);toast('Imagem enviada.','success');
      }catch(err){toast(err?.message||'Não foi possível enviar a imagem.','error')}
      finally{picker.classList.remove('is-uploading');picker.querySelector('strong').textContent='Escolher imagem'}
    });
  });
}
function enhanceImagePerformance(root=document){root.querySelectorAll?.('img:not([loading])').forEach((img,i)=>{if(i>1)img.loading='lazy';img.decoding='async';img.addEventListener('error',()=>img.classList.add('image-broken'),{once:true})})}

function polish(){themeControl();enhanceMediaUploads();enhanceImagePerformance();enhanceButtons();enhanceForms();activeNavigation();enhanceTables();enhanceExternalLinks();enhanceEmptyStates();breadcrumbs();mobileNav()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',polish);else polish();
// auth.js reconstrói a navegação após o carregamento.
setTimeout(()=>{themeControl();activeNavigation();enhanceButtons();enhanceMediaUploads();enhanceImagePerformance()},800);
const mediaObserver=new MutationObserver(m=>m.forEach(x=>x.addedNodes.forEach(n=>{if(n.nodeType===1){themeControl();enhanceMediaUploads(n);enhanceImagePerformance(n)}})));if(document.body)mediaObserver.observe(document.body,{childList:true,subtree:true});
