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
