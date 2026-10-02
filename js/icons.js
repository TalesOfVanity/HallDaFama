// Etapa 5.6 — sistema local de iconografia da interface.
// SVGs monocromáticos inspirados na linguagem visual Lucide; sem emojis/fontes externas.
const P={
 users:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
 user:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
 trophy:'<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM7 6H4v2a4 4 0 0 0 4 4M17 6h3v2a4 4 0 0 1-4 4"/>',
 shield:'<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/>',
 book:'<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z"/><path d="M4 5.5v14"/>',
 compass:'<circle cx="12" cy="12" r="10"/><path d="m16 8-2.5 5.5L8 16l2.5-5.5z"/>',
 scroll:'<path d="M6 3h12v18H6a3 3 0 0 1 0-6h12M9 7h6M9 11h6"/>',
 archive:'<rect x="3" y="4" width="18" height="5" rx="1"/><path d="M5 9v11h14V9M10 13h4"/>',
 bookmark:'<path d="M6 3h12v18l-6-4-6 4z"/>',
 bell:'<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>',
 award:'<circle cx="12" cy="8" r="6"/><path d="m8.5 13.5-1.5 8 5-3 5 3-1.5-8"/>',
 settings:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1V21H9.6v-.1A1.7 1.7 0 0 0 8.5 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1-.4H3V9.6h.1A1.7 1.7 0 0 0 4.6 8.5a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1V3h4v.1A1.7 1.7 0 0 0 15.5 4.6a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 9c.3.3.5.7.6 1h1v4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
 logout:'<path d="M10 17l5-5-5-5M15 12H3M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>',
 inbox:'<path d="M4 4h16v16H4zM4 13h5l2 3h2l2-3h5"/>',
 calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18"/>',
 plus:'<path d="M12 5v14M5 12h14"/>',
 heart:'<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"/>',
 swords:'<path d="m14.5 17.5 3 3M3 3l18 18M14 6l4-4 4 4-4 4M10 14l-4 4M3 21l4-4"/>',
 sparkles:'<path d="m12 3-1.2 3.8L7 8l3.8 1.2L12 13l1.2-3.8L17 8l-3.8-1.2zM19 14l-.8 2.2L16 17l2.2.8L19 20l.8-2.2L22 17l-2.2-.8zM5 14l-.8 2.2L2 17l2.2.8L5 20l.8-2.2L8 17l-2.2-.8z"/>',
 crown:'<path d="m3 6 4 5 5-7 5 7 4-5-2 13H5zM5 19h14"/>',
 comment:'<path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"/>',
 pencil:'<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4z"/>',
 trash:'<path d="M3 6h18M8 6V4h8v2M19 6l-1 15H6L5 6M10 11v6M14 11v6"/>',
 chevronDown:'<path d="m6 9 6 6 6-6"/>',
 shieldCheck:'<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/>',
 userCog:'<circle cx="9" cy="7" r="4"/><path d="M2 21a7 7 0 0 1 10-6.3M18 16v2M18 22v-1M15.4 17.5l1.7 1M20.6 20.5l-1.7-1M15.4 20.5l1.7-1M20.6 17.5l-1.7 1"/>',
 ellipsis:'<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>'
};
export function icon(name,label="",cls="") {return `<svg class="ui-icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[name]||P.sparkles}</svg>${label?`<span>${label}</span>`:""}`}
