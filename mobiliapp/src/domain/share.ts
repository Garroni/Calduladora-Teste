import { EXERCISE_BY_ID } from '../data/exercises';
import { OBJECTIVE_BY_ID, REGION_BY_ID } from '../data/taxonomy';
import type { ObjectiveId, RegionId, Sequence, SequenceItem } from '../data/types';
import { clampWork } from './sequence';

/** Versão do formato do link de rotina. */
export const SHARE_VERSION = '1';

export type ShareParams = Record<string, string>;

/**
 * Codifica uma rotina em parâmetros de URL curtos, para link e QR code.
 * Ex.: v=1&n=Aquecimento&o=agachamento&i=joelho-parede.40,gato-vaca.45
 */
export function encodeSequence(seq: Pick<Sequence, 'nome' | 'itens' | 'objetivo' | 'regiao' | 'notas' | 'autor'>): ShareParams {
  const params: ShareParams = {
    v: SHARE_VERSION,
    n: seq.nome,
    i: seq.itens.map((it) => `${it.exerciseId}.${it.trabalhoSeg}`).join(','),
  };
  if (seq.objetivo) params.o = seq.objetivo;
  if (seq.regiao) params.r = seq.regiao;
  if (seq.notas) params.nt = seq.notas;
  if (seq.autor) params.a = seq.autor;
  return params;
}

export function toQueryString(params: ShareParams): string {
  return Object.entries(params)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
}

/**
 * Monta o link completo da rotina. A query string é montada aqui (e não pelo
 * Linking.createURL) para que o link seja idêntico em iOS, Android e web.
 */
export function buildShareUrl(base: string, params: ShareParams): string {
  const clean = base.replace(/\/$/, '');
  return `${clean}${clean.includes('?') ? '&' : '?'}${toQueryString(params)}`;
}

/** Lê a query string de um link colado (sem depender de URLSearchParams). */
export function parseQueryString(text: string): ShareParams {
  const trimmed = text.trim();
  const qIndex = trimmed.indexOf('?');
  const query = (qIndex >= 0 ? trimmed.slice(qIndex + 1) : trimmed).split('#')[0];
  const params: ShareParams = {};
  for (const part of query.split('&')) {
    if (!part) continue;
    const eq = part.indexOf('=');
    const rawKey = eq >= 0 ? part.slice(0, eq) : part;
    const rawValue = eq >= 0 ? part.slice(eq + 1) : '';
    try {
      params[decodeURIComponent(rawKey)] = decodeURIComponent(rawValue.replace(/\+/g, ' '));
    } catch {
      // Ignora parâmetros malformados.
    }
  }
  return params;
}

/** Desfaz uma camada extra de codificação, se o link tiver passado por um codificador duplo. */
function decodeLeftover(value: string | undefined): string | undefined {
  if (value === undefined || !/%[0-9A-Fa-f]{2}/.test(value)) return value;
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function hasOwn(obj: object, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

export interface DecodedSequence {
  nome: string;
  itens: SequenceItem[];
  objetivo?: ObjectiveId;
  regiao?: RegionId;
  notas?: string;
  autor?: string;
  /** IDs que não existem neste catálogo (ex.: link criado em versão mais nova). */
  desconhecidos: string[];
}

export function decodeSequence(params: Record<string, string | string[] | undefined>): DecodedSequence | null {
  const get = (k: string): string | undefined => {
    const v = params[k];
    return decodeLeftover(Array.isArray(v) ? v[0] : v);
  };
  const raw = get('i');
  if (!raw) return null;

  const itens: SequenceItem[] = [];
  const desconhecidos: string[] = [];
  for (const chunk of raw.split(',')) {
    const dot = chunk.lastIndexOf('.');
    const id = dot >= 0 ? chunk.slice(0, dot) : chunk;
    const seg = dot >= 0 ? Number(chunk.slice(dot + 1)) : NaN;
    const ex = hasOwn(EXERCISE_BY_ID, id) ? EXERCISE_BY_ID[id] : undefined;
    if (!ex) {
      if (id) desconhecidos.push(id);
      continue;
    }
    itens.push({ exerciseId: id, trabalhoSeg: clampWork(Number.isFinite(seg) ? seg : ex.duracaoSeg) });
  }
  if (itens.length === 0) return null;

  const o = get('o');
  const r = get('r');
  return {
    nome: (get('n') ?? 'Rotina compartilhada').slice(0, 80),
    itens,
    objetivo: o && hasOwn(OBJECTIVE_BY_ID, o) ? (o as ObjectiveId) : undefined,
    regiao: r && hasOwn(REGION_BY_ID, r) ? (r as RegionId) : undefined,
    notas: get('nt')?.slice(0, 500),
    autor: get('a')?.slice(0, 60),
    desconhecidos,
  };
}
