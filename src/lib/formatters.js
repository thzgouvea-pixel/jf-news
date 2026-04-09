export function formatTimeAgo(dateValue) {
  if (!dateValue) return "";

  try {
    const minutes = Math.floor((new Date() - new Date(dateValue)) / 60000);
    if (minutes < 1) return "agora";
    if (minutes < 60) return `há ${minutes} min`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `há ${hours}h`;

    const days = Math.floor(hours / 24);
    if (days === 1) return "ontem";
    if (days < 7) return `há ${days} dias`;

    return new Date(dateValue).toLocaleDateString("pt-BR", {
      day: "numeric",
      month: "short",
    });
  } catch {
    return "";
  }
}

export function formatMatchDate(dateValue) {
  if (!dateValue) return "Sem data confirmada";

  try {
    const parsed = new Date(dateValue);
    return Number.isNaN(parsed.getTime())
      ? dateValue
      : parsed.toLocaleDateString("pt-BR", {
          day: "numeric",
          month: "long",
        });
  } catch {
    return dateValue;
  }
}

export function detectDevice() {
  if (typeof window === "undefined") return "unknown";

  const ua = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return "ios";
  if (/android/.test(ua)) return "android";
  return "desktop";
}
