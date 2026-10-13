import type { AssessmentEntry, AssessmentProtocol } from '../data/assessments';

/** Avaliações comparáveis: mesmo protocolo, mesmo período do dia e mesma condição de aquecimento. */
export function isComparable(a: AssessmentEntry, b: AssessmentEntry): boolean {
  return a.protocoloId === b.protocoloId && a.periodo === b.periodo && a.aquecido === b.aquecido;
}

export function entriesFor(entries: AssessmentEntry[], protocoloId: string): AssessmentEntry[] {
  return entries
    .filter((e) => e.protocoloId === protocoloId)
    .sort((a, b) => a.data.localeCompare(b.data));
}

/** Valor representativo da avaliação (média dos lados, quando bilateral). */
export function entryValue(entry: AssessmentEntry): number {
  if (entry.valorEsquerdo === undefined) return entry.valor;
  return (entry.valor + entry.valorEsquerdo) / 2;
}

export interface ProgressSummary {
  ultimo?: AssessmentEntry;
  referencia?: AssessmentEntry;
  /** Diferença (último − referência comparável), já no sentido "positivo = melhorou". */
  evolucao?: number;
  total: number;
}

export function summarize(entries: AssessmentEntry[], protocol: AssessmentProtocol): ProgressSummary {
  const list = entriesFor(entries, protocol.id);
  const ultimo = list[list.length - 1];
  if (!ultimo) return { total: 0 };
  const referencia = [...list.slice(0, -1)].reverse().find((e) => isComparable(e, ultimo));
  if (!referencia) return { ultimo, total: list.length };
  const raw = entryValue(ultimo) - entryValue(referencia);
  return {
    ultimo,
    referencia,
    evolucao: protocol.maiorMelhor ? raw : -raw,
    total: list.length,
  };
}

export function formatValue(value: number, protocol: AssessmentProtocol): string {
  if (protocol.unidade === 'pontos') return `${value} ${value === 1 ? 'ponto' : 'pontos'}`;
  const v = Number.isInteger(value) ? value.toString() : value.toFixed(1).replace('.', ',');
  return `${v} cm`;
}

/** Diferença entre os lados direito e esquerdo, se houver. */
export function asymmetry(entry: AssessmentEntry): number | null {
  if (entry.valorEsquerdo === undefined) return null;
  return Math.abs(entry.valor - entry.valorEsquerdo);
}
