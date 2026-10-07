const KEY='tales:last-location';
export function initNavigationState(){
  const page=location.pathname.replace(/\/+$/,'')||'/';
  const key=`tales:scroll:${page}${location.search}`;
  const saved=sessionStorage.getItem(key);
  if(saved && performance.getEntriesByType('navigation')[0]?.type==='back_forward') requestAnimationFrame(()=>scrollTo(0,Number(saved)||0));
  let t; addEventListener('scroll',()=>{clearTimeout(t);t=setTimeout(()=>sessionStorage.setItem(key,String(scrollY)),80)},{passive:true});
  document.addEventListener('click',ev=>{const a=ev.target.closest('a[href]');if(!a||a.target==='_blank'||a.href.startsWith('javascript:'))return;try{const u=new URL(a.href,location.href);if(u.origin===location.origin)localStorage.setItem(KEY,JSON.stringify({href:location.href,title:document.title,at:Date.now()}))}catch{}});
}
export function getLastLocation(){try{return JSON.parse(localStorage.getItem(KEY)||'null')}catch{return null}}
export function rememberPreference(name,value){localStorage.setItem(`tales:pref:${name}`,String(value))}
export function readPreference(name,fallback=''){return localStorage.getItem(`tales:pref:${name}`)??fallback}
