import{escapeHTML}from'./utils.js';
const e=v=>escapeHTML(String(v??''));
export function attachDraft(form,key,fields=['description','content','summary']){
 if(!form)return;const storage=`tales:draft:${key}`;const controls=fields.map(n=>form.elements[n]).filter(Boolean);if(!controls.length)return;
 const raw=localStorage.getItem(storage);if(raw){try{const data=JSON.parse(raw);const has=controls.some(x=>data[x.name]);if(has&&confirm('Encontramos alterações não enviadas. Restaurar rascunho?'))controls.forEach(x=>{if(data[x.name]!=null)x.value=data[x.name]})}catch{}}
 let timer;const save=()=>{const data={};controls.forEach(x=>data[x.name]=x.value);localStorage.setItem(storage,JSON.stringify(data))};controls.forEach(x=>x.addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(save,300)}));form.addEventListener('submit',()=>setTimeout(()=>localStorage.removeItem(storage),1000));
}
export function addPreviewToggle(form,fields=['title','description','content','summary']){
 if(!form||form.querySelector('.editor-preview-toggle'))return;const bar=document.createElement('div');bar.className='editor-preview-toggle';bar.innerHTML='<button type="button" class="active" data-mode="edit">Editar</button><button type="button" data-mode="preview">Visualizar</button>';const preview=document.createElement('div');preview.className='editor-preview prose';preview.hidden=true;form.prepend(bar);bar.after(preview);
 const render=()=>{const vals={};fields.forEach(n=>{if(form.elements[n])vals[n]=form.elements[n].value});preview.innerHTML=`${vals.title?`<h3>${e(vals.title)}</h3>`:''}<p>${e(vals.description||vals.summary||vals.content||'Nada para visualizar ainda.').replace(/\n/g,'<br>')}</p>${vals.content&&vals.summary?`<div>${e(vals.content).replace(/\n/g,'<br>')}</div>`:''}`};
 bar.onclick=ev=>{const b=ev.target.closest('button');if(!b)return;const show=b.dataset.mode==='preview';bar.querySelectorAll('button').forEach(x=>x.classList.toggle('active',x===b));[...form.children].forEach(x=>{if(x===bar||x===preview)return;x.hidden=show});preview.hidden=!show;if(show)render()};
}
