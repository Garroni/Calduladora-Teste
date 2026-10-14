const ACCENTS: Record<string, string> = {
  á: 'a', à: 'a', â: 'a', ã: 'a', ä: 'a',
  é: 'e', è: 'e', ê: 'e', ë: 'e',
  í: 'i', ì: 'i', î: 'i', ï: 'i',
  ó: 'o', ò: 'o', ô: 'o', õ: 'o', ö: 'o',
  ú: 'u', ù: 'u', û: 'u', ü: 'u',
  ç: 'c', ñ: 'n',
};

/**
 * Normaliza texto para busca: minúsculas e sem acentos.
 * Implementado sem `String.prototype.normalize` para não depender do suporte
 * a Unicode do motor JavaScript do aparelho.
 */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[áàâãäéèêëíìîïóòôõöúùûüçñ]/g, (c) => ACCENTS[c] ?? c)
    .trim();
}

export function tokens(text: string): string[] {
  return normalize(text)
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 0);
}

export function newId(prefix = ''): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}${Date.now().toString(36)}${rand}`;
}

export function formatDuration(totalSeg: number): string {
  const seg = Math.max(0, Math.round(totalSeg));
  const m = Math.floor(seg / 60);
  const s = seg % 60;
  if (m === 0) return `${s} s`;
  if (s === 0) return `${m} min`;
  return `${m} min ${s.toString().padStart(2, '0')} s`;
}

export function formatClock(totalSeg: number): string {
  const seg = Math.max(0, Math.ceil(totalSeg));
  const m = Math.floor(seg / 60);
  const s = seg % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  const dd = d.getDate().toString().padStart(2, '0');
  const mm = (d.getMonth() + 1).toString().padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
}

export function joinOr(items: string[]): string {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} ou ${items[items.length - 1]}`;
}
