import { EXERCISES } from '../data/exercises';
import {
  EQUIPMENT_BY_ID,
  MOVEMENT_TYPE_BY_ID,
  OBJECTIVE_BY_ID,
  REGION_BY_ID,
} from '../data/taxonomy';
import type {
  Difficulty,
  EquipCategoryId,
  EquipId,
  Exercise,
  MovementType,
  ObjectiveId,
  RegionId,
} from '../data/types';
import { joinOr, normalize, tokens } from './text';

export type Kit = ReadonlySet<EquipId> | readonly EquipId[];

function toSet(kit: Kit): ReadonlySet<EquipId> {
  return kit instanceof Set ? kit : new Set(kit as readonly EquipId[]);
}

/** Requisitos do exercício que o kit não atende (cada um é uma lista de opções). */
export function missingRequirements(exercise: Exercise, kit: Kit): EquipId[][] {
  const owned = toSet(kit);
  return exercise.requisitos.filter((slot) => !slot.some((e) => owned.has(e)));
}

export function isCompatible(exercise: Exercise, kit: Kit): boolean {
  return missingRequirements(exercise, kit).length === 0;
}

export function describeRequirement(slot: EquipId[]): string {
  return joinOr(slot.map((e) => EQUIPMENT_BY_ID[e].nome));
}

export function describeMissing(exercise: Exercise, kit: Kit): string | null {
  const missing = missingRequirements(exercise, kit);
  if (missing.length === 0) return null;
  return missing.map(describeRequirement).join(' + ');
}

/** Todos os equipamentos que o exercício pode usar (obrigatórios e opcionais). */
export function equipmentUsed(exercise: Exercise): EquipId[] {
  return Array.from(new Set([...exercise.requisitos.flat(), ...(exercise.opcionais ?? [])]));
}

export type CategoryFilter = EquipCategoryId | 'sem';

export interface CatalogFilters {
  busca?: string;
  regioes?: RegionId[];
  objetivos?: ObjectiveId[];
  tipos?: MovementType[];
  categorias?: CategoryFilter[];
  dificuldadeMax?: Difficulty;
  somenteCompativeis?: boolean;
  somenteRevisados?: boolean;
}

const searchIndex = new Map<string, string>();

function haystack(exercise: Exercise): string {
  let cached = searchIndex.get(exercise.id);
  if (cached) return cached;
  cached = normalize(
    [
      exercise.nome,
      ...(exercise.outrosNomes ?? []),
      ...exercise.musculos,
      ...exercise.regioes.map((r) => REGION_BY_ID[r].nome),
      ...exercise.objetivos.map((o) => OBJECTIVE_BY_ID[o].nome),
      ...equipmentUsed(exercise).map((e) => EQUIPMENT_BY_ID[e].nome),
      MOVEMENT_TYPE_BY_ID[exercise.tipo].nome,
    ].join(' '),
  );
  searchIndex.set(exercise.id, cached);
  return cached;
}

export function matchesSearch(exercise: Exercise, query: string): boolean {
  const qs = tokens(query);
  if (qs.length === 0) return true;
  const text = haystack(exercise);
  return qs.every((q) => text.includes(q));
}

function matchesCategory(exercise: Exercise, categorias: CategoryFilter[]): boolean {
  if (categorias.length === 0) return true;
  const used = equipmentUsed(exercise);
  return categorias.some((cat) =>
    cat === 'sem'
      ? exercise.requisitos.length === 0
      : used.some((e) => EQUIPMENT_BY_ID[e].categoria === cat),
  );
}

export function filterExercises(
  filters: CatalogFilters,
  kit: Kit,
  source: Exercise[] = EXERCISES,
): Exercise[] {
  const owned = toSet(kit);
  const result = source.filter((ex) => {
    if (filters.busca && !matchesSearch(ex, filters.busca)) return false;
    if (filters.regioes?.length && !ex.regioes.some((r) => filters.regioes!.includes(r))) return false;
    if (filters.objetivos?.length && !ex.objetivos.some((o) => filters.objetivos!.includes(o))) return false;
    if (filters.tipos?.length && !filters.tipos.includes(ex.tipo)) return false;
    if (filters.categorias?.length && !matchesCategory(ex, filters.categorias)) return false;
    if (filters.dificuldadeMax && ex.dificuldade > filters.dificuldadeMax) return false;
    if (filters.somenteRevisados && ex.revisao.status !== 'revisado') return false;
    if (filters.somenteCompativeis && !isCompatible(ex, owned)) return false;
    return true;
  });
  return result.sort((a, b) => {
    const ca = isCompatible(a, owned) ? 0 : 1;
    const cb = isCompatible(b, owned) ? 0 : 1;
    if (ca !== cb) return ca - cb;
    if (a.dificuldade !== b.dificuldade) return a.dificuldade - b.dificuldade;
    return a.nome.localeCompare(b.nome, 'pt-BR');
  });
}

function overlap<T>(a: readonly T[], b: readonly T[]): number {
  return a.filter((x) => b.includes(x)).length;
}

function similarity(base: Exercise, candidate: Exercise): number {
  let score = 0;
  if (candidate.tipo === base.tipo) score += 3;
  score += overlap(base.objetivos, candidate.objetivos);
  score += overlap(base.regioes, candidate.regioes) * 1.5;
  score -= Math.abs(base.dificuldade - candidate.dificuldade) * 0.5;
  return score;
}

export interface Alternatives {
  /** Mesma família funcional: substituições adequadas. */
  equivalentes: Exercise[];
  /** Mesma região e objetivo, mas outra finalidade: não são substitutos diretos. */
  relacionados: Exercise[];
}

/**
 * Sugere alternativas compatíveis com o kit. Só exercícios da mesma família
 * são tratados como substitutos; os demais aparecem separados como "relacionados",
 * para evitar trocas biomecanicamente inadequadas.
 */
export function findAlternatives(
  exercise: Exercise,
  kit: Kit,
  options: { dificuldadeMax?: Difficulty; source?: Exercise[] } = {},
): Alternatives {
  const owned = toSet(kit);
  const source = options.source ?? EXERCISES;
  const eligible = source.filter(
    (c) =>
      c.id !== exercise.id &&
      isCompatible(c, owned) &&
      (!options.dificuldadeMax || c.dificuldade <= options.dificuldadeMax),
  );
  const byScore = (a: Exercise, b: Exercise) => similarity(exercise, b) - similarity(exercise, a);

  const equivalentes = eligible.filter((c) => c.familia === exercise.familia).sort(byScore);
  const relacionados = eligible
    .filter(
      (c) =>
        c.familia !== exercise.familia &&
        c.tipo === exercise.tipo &&
        overlap(c.regioes, exercise.regioes) > 0 &&
        overlap(c.objetivos, exercise.objetivos) > 0,
    )
    .sort(byScore)
    .slice(0, 3);

  return { equivalentes, relacionados };
}

/** Equipamentos que, se adquiridos, liberariam mais exercícios (para sugerir ao usuário). */
export function unlockSuggestions(kit: Kit, source: Exercise[] = EXERCISES): { equip: EquipId; libera: number }[] {
  const owned = toSet(kit);
  const counts = new Map<EquipId, number>();
  for (const ex of source) {
    const missing = missingRequirements(ex, owned);
    if (missing.length !== 1) continue;
    for (const e of missing[0]) counts.set(e, (counts.get(e) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([equip, libera]) => ({ equip, libera }))
    .sort((a, b) => b.libera - a.libera);
}
