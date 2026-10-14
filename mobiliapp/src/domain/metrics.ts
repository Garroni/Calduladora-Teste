/**
 * Métricas do teste com usuários (etapas 3 e 4 da validação).
 * Tudo fica salvo apenas no aparelho e só sai dele quando o usuário exporta.
 */

export type MetricEventType =
  | 'sessao_inicio'
  | 'filtro'
  | 'busca'
  | 'exercicio_visto'
  | 'alternativa_vista'
  | 'sequencia_gerada'
  | 'sequencia_iniciada'
  | 'sequencia_concluida'
  | 'rotina_salva'
  | 'rotina_compartilhada'
  | 'rotina_importada';

export interface MetricEvent {
  t: number;
  tipo: MetricEventType;
  sessao: string;
  dados?: Record<string, string | number | boolean>;
}

export type WouldPay = 'sim' | 'talvez' | 'nao';

export interface FeedbackAnswer {
  t: number;
  /** 1 (nunca) a 5 (com certeza). */
  voltaria: number;
  pagaria: WouldPay;
  recursos: string[];
  comentario?: string;
}

export const PAID_FEATURE_OPTIONS = [
  'Vídeos demonstrativos em alta qualidade',
  'Montador de sequências avançado',
  'Avaliações e acompanhamento de progresso',
  'Modo profissional (montar e enviar rotinas)',
  'Programas de várias semanas',
  'Biblioteca maior de exercícios',
];

export interface MetricsSummary {
  sessoes: number;
  encontrouCompativel: boolean;
  /** Mediana, por sessão, do tempo até abrir o primeiro exercício compatível com o kit. */
  tempoAteEncontrarSeg: number | null;
  exerciciosVistos: number;
  sequenciasGeradas: number;
  sequenciasIniciadas: number;
  sequenciasConcluidas: number;
  rotinasCompartilhadas: number;
  filtrosUsados: Record<string, number>;
  feedback?: FeedbackAnswer;
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function summarizeMetrics(events: MetricEvent[], feedback: FeedbackAnswer[]): MetricsSummary {
  const count = (tipo: MetricEventType) => events.filter((e) => e.tipo === tipo).length;
  const sessionStarts = new Map<string, number>();
  for (const e of events) {
    if (e.tipo === 'sessao_inicio' && !sessionStarts.has(e.sessao)) sessionStarts.set(e.sessao, e.t);
  }

  const firstFind = new Map<string, number>();
  for (const e of events) {
    if (e.tipo !== 'exercicio_visto' || e.dados?.compativel !== true) continue;
    if (!firstFind.has(e.sessao)) firstFind.set(e.sessao, e.t);
  }
  const times: number[] = [];
  firstFind.forEach((t, sessao) => {
    const start = sessionStarts.get(sessao);
    if (start !== undefined) times.push((t - start) / 1000);
  });

  const filtrosUsados: Record<string, number> = {};
  for (const e of events) {
    if (e.tipo !== 'filtro') continue;
    const key = String(e.dados?.filtro ?? 'outro');
    filtrosUsados[key] = (filtrosUsados[key] ?? 0) + 1;
  }

  const med = median(times);
  return {
    sessoes: sessionStarts.size,
    encontrouCompativel: firstFind.size > 0,
    tempoAteEncontrarSeg: med === null ? null : Math.round(med),
    exerciciosVistos: count('exercicio_visto'),
    sequenciasGeradas: count('sequencia_gerada'),
    sequenciasIniciadas: count('sequencia_iniciada'),
    sequenciasConcluidas: count('sequencia_concluida'),
    rotinasCompartilhadas: count('rotina_compartilhada'),
    filtrosUsados,
    feedback: feedback[feedback.length - 1],
  };
}
