import { EXERCISE_BY_ID, EXERCISES } from '../data/exercises';
import { OBJECTIVE_BY_ID, REGION_BY_ID } from '../data/taxonomy';
import type {
  Difficulty,
  Exercise,
  MovementType,
  ObjectiveId,
  RegionId,
  SequenceItem,
} from '../data/types';
import { findAlternatives, isCompatible, type Kit } from './catalog';

export const TRANSICAO_SEG = 10;
export const TROCA_LADO_SEG = 5;
export const PREPARO_INICIAL_SEG = 5;
export const MIN_TRABALHO_SEG = 20;
export const MAX_TRABALHO_SEG = 90;
export const PASSO_TRABALHO_SEG = 5;

/** Ordem das fases numa sequência: soltar → mover → alongar → controlar → integrar. */
export const PHASE_ORDER: MovementType[] = [
  'liberacao',
  'mobilidade',
  'alongamento',
  'controle',
  'integracao',
];

/**
 * Peso de cada fase por objetivo. Uma fase ausente não entra na sequência
 * (ex.: alongamento estático sustentado não entra na preparação para treino).
 */
export const PHASE_PROFILE: Record<ObjectiveId, Partial<Record<MovementType, number>>> = {
  pre_treino: { liberacao: 0.1, mobilidade: 0.45, controle: 0.25, integracao: 0.2 },
  agachamento: { liberacao: 0.15, mobilidade: 0.4, controle: 0.2, integracao: 0.25 },
  overhead: { liberacao: 0.15, mobilidade: 0.45, alongamento: 0.1, controle: 0.3 },
  corrida: { liberacao: 0.1, mobilidade: 0.5, controle: 0.25, integracao: 0.15 },
  quadril: { liberacao: 0.1, mobilidade: 0.45, alongamento: 0.2, controle: 0.25 },
  toracica: { liberacao: 0.1, mobilidade: 0.55, alongamento: 0.1, controle: 0.25 },
  controle: { mobilidade: 0.3, controle: 0.55, integracao: 0.15 },
  amplitude: { liberacao: 0.2, mobilidade: 0.35, alongamento: 0.35, controle: 0.1 },
};

/** Regiões usadas para completar uma sequência quando a região escolhida tem poucas opções. */
const NEIGHBOR_REGIONS: Record<Exclude<RegionId, 'corpo_inteiro'>, RegionId[]> = {
  cervical: ['toracica', 'ombro'],
  ombro: ['toracica'],
  punho: ['ombro'],
  toracica: ['ombro', 'lombar'],
  lombar: ['quadril', 'toracica'],
  quadril: ['lombar', 'tornozelo'],
  tornozelo: ['quadril'],
};

export function sidesOf(exerciseId: string): 1 | 2 {
  return EXERCISE_BY_ID[exerciseId]?.unilateral ? 2 : 1;
}

export function itemSeconds(item: SequenceItem): number {
  const lados = sidesOf(item.exerciseId);
  return item.trabalhoSeg * lados + (lados === 2 ? TROCA_LADO_SEG : 0);
}

export function sequenceSeconds(itens: SequenceItem[]): number {
  if (itens.length === 0) return 0;
  return itens.reduce((sum, i) => sum + itemSeconds(i), 0) + TRANSICAO_SEG * (itens.length - 1);
}

export function clampWork(seg: number): number {
  const stepped = Math.round(seg / PASSO_TRABALHO_SEG) * PASSO_TRABALHO_SEG;
  return Math.min(MAX_TRABALHO_SEG, Math.max(MIN_TRABALHO_SEG, stepped));
}

/** Gerador pseudoaleatório com semente, para que "gerar outra opção" seja reprodutível. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface BuilderInput {
  kit: Kit;
  objetivo: ObjectiveId;
  regiao?: RegionId | null;
  minutos: number;
  nivel: Difficulty;
  seed?: number;
  source?: Exercise[];
}

export interface BuilderOutput {
  nome: string;
  itens: SequenceItem[];
  totalSeg: number;
  avisos: string[];
}

function allocateSlots(n: number, weights: [MovementType, number][]): Map<MovementType, number> {
  const total = weights.reduce((s, [, w]) => s + w, 0);
  const raw = weights.map(([phase, w]) => ({ phase, exact: (n * w) / total }));
  const slots = new Map<MovementType, number>(raw.map((r) => [r.phase, Math.floor(r.exact)]));
  let assigned = Array.from(slots.values()).reduce((a, b) => a + b, 0);
  const byRemainder = [...raw].sort(
    (a, b) => b.exact - Math.floor(b.exact) - (a.exact - Math.floor(a.exact)),
  );
  for (const r of byRemainder) {
    if (assigned >= n) break;
    slots.set(r.phase, (slots.get(r.phase) ?? 0) + 1);
    assigned++;
  }
  // Fases relevantes (≥ 20%) recebem pelo menos um exercício quando houver espaço.
  for (const [phase, w] of weights) {
    if (w / total < 0.2 || (slots.get(phase) ?? 0) > 0) continue;
    const donor = Array.from(slots.entries()).sort((a, b) => b[1] - a[1])[0];
    if (donor && donor[1] > 1) {
      slots.set(donor[0], donor[1] - 1);
      slots.set(phase, 1);
    }
  }
  return slots;
}

/** Ajusta os tempos de trabalho para que a sequência ocupe o tempo disponível. */
export function fitDurations(chosen: Exercise[], budgetSeg: number): SequenceItem[] {
  if (chosen.length === 0) return [];
  const fixed =
    TRANSICAO_SEG * (chosen.length - 1) +
    chosen.reduce((s, ex) => s + (ex.unilateral ? TROCA_LADO_SEG : 0), 0);
  const baseWork = chosen.reduce((s, ex) => s + ex.duracaoSeg * (ex.unilateral ? 2 : 1), 0);
  const factor = Math.max(0, budgetSeg - fixed) / baseWork;
  const itens = chosen.map((ex) => ({
    exerciseId: ex.id,
    trabalhoSeg: clampWork(ex.duracaoSeg * factor),
  }));

  // Ajuste fino em passos de 5 s, distribuído em rodízio entre os exercícios.
  let cursor = 0;
  for (let guard = 0; guard < 200; guard++) {
    const diff = budgetSeg - sequenceSeconds(itens);
    if (Math.abs(diff) < PASSO_TRABALHO_SEG) break;
    const direction = diff > 0 ? 1 : -1;
    let changed = false;
    for (let j = 0; j < itens.length; j++) {
      const idx = (cursor + j) % itens.length;
      const item = itens[idx];
      const delta = PASSO_TRABALHO_SEG * sidesOf(item.exerciseId);
      if (delta > Math.abs(diff) + PASSO_TRABALHO_SEG / 2) continue;
      const next = item.trabalhoSeg + direction * PASSO_TRABALHO_SEG;
      if (next < MIN_TRABALHO_SEG || next > MAX_TRABALHO_SEG) continue;
      item.trabalhoSeg = next;
      cursor = idx + 1;
      changed = true;
      break;
    }
    if (!changed) break;
  }
  return itens;
}

export function sequenceName(objetivo: ObjectiveId, regiao: RegionId | null | undefined, minutos: number): string {
  const obj = OBJECTIVE_BY_ID[objetivo].nome;
  const prefix = regiao && regiao !== 'corpo_inteiro' ? `${REGION_BY_ID[regiao].curto} · ` : '';
  return `${prefix}${obj} · ${minutos} min`;
}

/**
 * Monta uma sequência respeitando a finalidade de cada exercício: escolhe
 * exercícios por fase (liberação → mobilidade → alongamento → controle → integração)
 * conforme o perfil do objetivo, cobre as regiões-alvo, evita repetir a mesma
 * família funcional e ajusta os tempos ao tempo disponível.
 */
export function buildSequence(input: BuilderInput): BuilderOutput {
  const source = input.source ?? EXERCISES;
  const profile = PHASE_PROFILE[input.objetivo];
  const objetivo = OBJECTIVE_BY_ID[input.objetivo];
  const regiaoEspecifica = input.regiao && input.regiao !== 'corpo_inteiro' ? input.regiao : null;
  const alvo: RegionId[] = regiaoEspecifica ? [regiaoEspecifica] : [...objetivo.regioesAlvo];
  const budget = Math.round(input.minutos * 60);
  const nome = sequenceName(input.objetivo, input.regiao, input.minutos);
  const avisos: string[] = [];
  const rng = mulberry32(input.seed ?? 1);

  const base = source.filter(
    (ex) =>
      isCompatible(ex, input.kit) &&
      ex.dificuldade <= input.nivel &&
      (profile[ex.tipo] ?? 0) > 0,
  );
  const regionMatch = (ex: Exercise) =>
    ex.regioes.some((r) => alvo.includes(r)) ||
    (!regiaoEspecifica && ex.regioes.includes('corpo_inteiro'));

  let pool = base.filter(regionMatch);
  if (regiaoEspecifica && pool.length < 3) {
    const vizinhas = NEIGHBOR_REGIONS[regiaoEspecifica];
    const extra = base.filter((ex) => !pool.includes(ex) && ex.regioes.some((r) => vizinhas.includes(r)));
    if (extra.length > 0) {
      const nomes = vizinhas.map((r) => REGION_BY_ID[r].nome.toLowerCase());
      avisos.push(
        `Há poucas opções para ${REGION_BY_ID[regiaoEspecifica].nome.toLowerCase()} com o seu kit. Completamos com regiões vizinhas (${nomes.join(', ')}).`,
      );
      pool = [...pool, ...extra];
      alvo.push(...vizinhas);
    }
  }
  if (pool.length === 0) {
    return {
      nome,
      itens: [],
      totalSeg: 0,
      avisos: [
        'Nenhum exercício compatível com o seu kit e nível para essa combinação. Tente outra região, aumente o nível ou adicione equipamentos.',
      ],
    };
  }

  const scores = new Map<string, number>();
  for (const ex of pool) {
    let s = 0;
    if (ex.objetivos.includes(input.objetivo)) s += 4;
    if (alvo.includes(ex.regioes[0])) s += 2;
    s += ex.regioes.filter((r) => alvo.includes(r)).length * 0.5;
    if (regiaoEspecifica && ex.regioes.includes(regiaoEspecifica)) s += 4;
    s -= (input.nivel - ex.dificuldade) * 0.3;
    s += rng() * 1.5;
    scores.set(ex.id, s);
  }

  const phasesAvailable = PHASE_ORDER.filter(
    (p) => (profile[p] ?? 0) > 0 && pool.some((ex) => ex.tipo === p),
  );
  const missingPhases = PHASE_ORDER.filter(
    (p) => (profile[p] ?? 0) >= 0.15 && !phasesAvailable.includes(p),
  );
  if (missingPhases.includes('liberacao')) {
    avisos.push('Sem bola ou rolo no seu kit: o tempo de liberação foi redistribuído para mobilidade e controle.');
  }

  const pick = (n: number): Exercise[] => {
    const slots = allocateSlots(
      n,
      phasesAvailable.map((p) => [p, profile[p] ?? 0] as [MovementType, number]),
    );
    const chosen: Exercise[] = [];
    const usedFamilies = new Set<string>();
    const covered = new Set<RegionId>();

    const best = (candidates: Exercise[]): Exercise | undefined => {
      let top: Exercise | undefined;
      let topScore = -Infinity;
      for (const ex of candidates) {
        let s = scores.get(ex.id) ?? 0;
        if (ex.regioes.some((r) => alvo.includes(r) && !covered.has(r))) s += 2.5;
        s -= chosen.filter((c) => c.regioes[0] === ex.regioes[0]).length * 1;
        if (s > topScore) {
          topScore = s;
          top = ex;
        }
      }
      return top;
    };
    const take = (ex: Exercise) => {
      chosen.push(ex);
      usedFamilies.add(ex.familia);
      ex.regioes.forEach((r) => covered.add(r));
    };

    let leftover = 0;
    for (const phase of PHASE_ORDER) {
      const count = slots.get(phase) ?? 0;
      for (let k = 0; k < count; k++) {
        const ex = best(pool.filter((c) => c.tipo === phase && !usedFamilies.has(c.familia)));
        if (ex) take(ex);
        else leftover++;
      }
    }
    // Vagas sem candidato vão para a fase mais "devedora" (peso alto, poucos exercícios).
    for (let k = 0; k < leftover; k++) {
      const open = phasesAvailable.filter((p) =>
        pool.some((c) => c.tipo === p && !usedFamilies.has(c.familia)),
      );
      if (open.length === 0) break;
      const need = (p: MovementType) =>
        (profile[p] ?? 0) / (chosen.filter((c) => c.tipo === p).length + 1);
      const phase = open.reduce((a, b) => (need(b) > need(a) ? b : a));
      const ex = best(pool.filter((c) => c.tipo === phase && !usedFamilies.has(c.familia)));
      if (!ex) break;
      take(ex);
    }
    return chosen.sort((a, b) => PHASE_ORDER.indexOf(a.tipo) - PHASE_ORDER.indexOf(b.tipo));
  };

  const families = new Set(pool.map((ex) => ex.familia)).size;
  let n = Math.min(families, Math.max(3, Math.min(16, Math.round(budget / 75))));
  let bestItens: SequenceItem[] = [];
  let bestGap = Infinity;
  const tried = new Set<number>();
  while (n >= 1 && !tried.has(n)) {
    tried.add(n);
    const chosen = pick(n);
    const itens = fitDurations(chosen, budget);
    const total = sequenceSeconds(itens);
    const gap = Math.abs(total - budget);
    if (gap < bestGap) {
      bestGap = gap;
      bestItens = itens;
    }
    if (total > budget * 1.08 && chosen.length > 1) n = chosen.length - 1;
    else if (total < budget * 0.92 && chosen.length === n && n < families) n = n + 1;
    else break;
  }

  const totalSeg = sequenceSeconds(bestItens);
  if (totalSeg < budget * 0.85) {
    avisos.push('Com o seu kit atual, a sequência ficou um pouco mais curta que o tempo escolhido.');
  }
  return { nome, itens: bestItens, totalSeg, avisos };
}

export interface AdaptResult {
  itens: SequenceItem[];
  trocas: { de: string; para: string }[];
  semAlternativa: string[];
}

/** Troca exercícios incompatíveis com o kit por equivalentes da mesma família. */
export function adaptToKit(itens: SequenceItem[], kit: Kit, nivel?: Difficulty): AdaptResult {
  const trocas: AdaptResult['trocas'] = [];
  const semAlternativa: string[] = [];
  const inUse = new Set(itens.map((i) => i.exerciseId));
  const adapted = itens.map((item) => {
    const ex = EXERCISE_BY_ID[item.exerciseId];
    if (!ex || isCompatible(ex, kit)) return item;
    const { equivalentes } = findAlternatives(ex, kit, { dificuldadeMax: nivel });
    const replacement =
      equivalentes.find((c) => !inUse.has(c.id)) ??
      findAlternatives(ex, kit).equivalentes.find((c) => !inUse.has(c.id));
    if (!replacement) {
      semAlternativa.push(ex.id);
      return item;
    }
    inUse.add(replacement.id);
    trocas.push({ de: ex.id, para: replacement.id });
    return { exerciseId: replacement.id, trabalhoSeg: item.trabalhoSeg };
  });
  return { itens: adapted, trocas, semAlternativa };
}

export type PlayerStep =
  | { kind: 'preparo'; seg: number; itemIndex: number }
  | { kind: 'trabalho'; seg: number; itemIndex: number; lado?: 'direito' | 'esquerdo' }
  | { kind: 'troca_lado'; seg: number; itemIndex: number }
  | { kind: 'transicao'; seg: number; itemIndex: number };

/** Linha do tempo do player: preparo, trabalho (por lado), troca de lado e transições. */
export function buildSteps(itens: SequenceItem[]): PlayerStep[] {
  const steps: PlayerStep[] = [];
  itens.forEach((item, itemIndex) => {
    if (itemIndex === 0) steps.push({ kind: 'preparo', seg: PREPARO_INICIAL_SEG, itemIndex });
    else steps.push({ kind: 'transicao', seg: TRANSICAO_SEG, itemIndex });
    if (sidesOf(item.exerciseId) === 2) {
      steps.push({ kind: 'trabalho', seg: item.trabalhoSeg, itemIndex, lado: 'direito' });
      steps.push({ kind: 'troca_lado', seg: TROCA_LADO_SEG, itemIndex });
      steps.push({ kind: 'trabalho', seg: item.trabalhoSeg, itemIndex, lado: 'esquerdo' });
    } else {
      steps.push({ kind: 'trabalho', seg: item.trabalhoSeg, itemIndex });
    }
  });
  return steps;
}
