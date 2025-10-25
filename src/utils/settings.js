import { settingsAPI } from '../services/api';

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

export function getPublicSettings() {
  try {
    const raw = localStorage.getItem('public_settings');
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export async function preloadSettings() {
  try {
    const res = await settingsAPI.getPublic();
    const payload = res?.data?.settings || {};
    localStorage.setItem('public_settings', JSON.stringify(payload));
    return payload;
  } catch {
    return getPublicSettings();
  }
}

export function getSocialLinks() {
  const server = getPublicSettings();
  const local = getAdminSettings();
  const src = server && Object.keys(server).length ? server : local;
  const facebookUrl = src?.social?.facebookUrl?.trim() || '';
  const whatsappUrl = normalizeWhatsApp(src?.social?.whatsappUrl);
  return { facebookUrl, whatsappUrl };
}
