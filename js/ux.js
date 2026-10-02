// Tales of Vanity 6.0 — camada global de UX e acessibilidade.
import { icon } from './icons.js';

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
 const b=document.createElement('button');b.type='button';b.className='mobile-nav-toggle';b.setAttribute('aria-label','Abrir menu de navegação');b.setAttribute('aria-expanded','false');b.innerHTML=icon('menu');b.onclick=()=>{const open=nav.classList.toggle('mobile-open');b.setAttribute('aria-expanded',String(open));b.setAttribute('aria-label',open?'Fechar menu de navegação':'Abrir menu de navegação')};nav.insertBefore(b,links)
}
function polish(){enhanceButtons();enhanceForms();activeNavigation();enhanceTables();enhanceExternalLinks();enhanceEmptyStates();breadcrumbs();mobileNav()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',polish);else polish();
// auth.js reconstrói a navegação após o carregamento.
setTimeout(()=>{activeNavigation();enhanceButtons()},800);
