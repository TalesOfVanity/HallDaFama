export function escapeHTML(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function initials(name = "?") {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(part => part[0])
    .join("")
    .toUpperCase() || "?";
}

export function formatDate(date) {
  if (!date) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium"
  }).format(new Date(date));
}

export function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

export function setStatus(element, message, type = "") {
  if (!element) return;
  element.textContent = message;
  element.className = `status ${type}`.trim();
}


export function avatarHTML(name = "Jogador", avatarUrl = "", alt = "") {
  const fallback = `<span class="avatar-fallback">${escapeHTML(initials(name))}</span>`;
  if (!avatarUrl) return fallback;
  return `${fallback}<img src="${escapeHTML(avatarUrl)}" alt="${escapeHTML(alt)}" loading="eager" decoding="async">`;
}

// Mantém as iniciais visíveis se uma imagem remota falhar ou demorar a carregar.
document.addEventListener("error", event => {
  const img = event.target;
  if (img instanceof HTMLImageElement && img.closest(".avatar")) img.remove();
}, true);
