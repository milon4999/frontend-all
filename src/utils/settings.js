export function getAdminSettings() {
  try {
    const raw = localStorage.getItem('admin_settings');
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function normalizeWhatsApp(input) {
  if (!input) return '';
  const val = String(input).trim();
  if (val.startsWith('http://') || val.startsWith('https://')) return val;
  const digits = val.replace(/\D/g, '');
  if (!digits) return '';
  return `https://wa.me/${digits}`;
}

export function getSocialLinks() {
  const s = getAdminSettings();
  const facebookUrl = s?.social?.facebookUrl?.trim() || '';
  const whatsappUrl = normalizeWhatsApp(s?.social?.whatsappUrl);
  return { facebookUrl, whatsappUrl };
}
