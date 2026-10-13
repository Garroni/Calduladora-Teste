import { ASSESSMENT_BY_ID, type AssessmentEntry } from '../../data/assessments';
import { asymmetry, formatValue, summarize } from '../assessment';
import { summarizeMetrics, type MetricEvent } from '../metrics';
import { buildShareUrl, decodeSequence, encodeSequence, parseQueryString, toQueryString } from '../share';

describe('compartilhamento por link / QR code', () => {
  const seq = {
    nome: 'Aquecimento — agachamento & ombros',
    objetivo: 'agachamento' as const,
    regiao: 'quadril' as const,
    notas: 'Respire fundo. Sem dor!',
    autor: 'Profa. Ana',
    itens: [
      { exerciseId: 'joelho-parede', trabalhoSeg: 40 },
      { exerciseId: 'gato-vaca', trabalhoSeg: 45 },
    ],
  };

  it('codifica e decodifica sem perder informação', () => {
    const link = `mobiliapp://importar?${toQueryString(encodeSequence(seq))}`;
    const decoded = decodeSequence(parseQueryString(link));
    expect(decoded).toEqual({ ...seq, desconhecidos: [] });
  });

  it('monta o link com um único nível de codificação', () => {
    const url = buildShareUrl('mobiliapp://importar', encodeSequence(seq));
    expect(url.startsWith('mobiliapp://importar?v=1&')).toBe(true);
    expect(url).not.toContain('%25');
    expect(url).toContain('i=joelho-parede.40%2Cgato-vaca.45');
    expect(decodeSequence(parseQueryString(url))?.nome).toBe(seq.nome);
    expect(buildShareUrl('exp://host/--/importar?x=1', { v: '1' })).toBe('exp://host/--/importar?x=1&v=1');
  });

  it('tolera links codificados duas vezes', () => {
    const twice = Object.fromEntries(
      Object.entries(encodeSequence(seq)).map(([k, v]) => [k, encodeURIComponent(v)]),
    );
    expect(decodeSequence(twice)).toEqual({ ...seq, desconhecidos: [] });
  });

  it('aceita a query string sem o esquema do link', () => {
    const decoded = decodeSequence(parseQueryString(toQueryString(encodeSequence(seq))));
    expect(decoded?.itens).toEqual(seq.itens);
  });

  it('descarta exercícios desconhecidos e informa', () => {
    const decoded = decodeSequence({ i: 'gato-vaca.45,nao-existe.30,constructor.20' });
    expect(decoded?.itens).toEqual([{ exerciseId: 'gato-vaca', trabalhoSeg: 45 }]);
    expect(decoded?.desconhecidos).toEqual(['nao-existe', 'constructor']);
  });

  it('limita tempos fora da faixa e ignora objetivo inválido', () => {
    const decoded = decodeSequence({ i: 'gato-vaca.9999,dead-bug.abc', o: 'toString' });
    expect(decoded?.itens).toEqual([
      { exerciseId: 'gato-vaca', trabalhoSeg: 90 },
      { exerciseId: 'dead-bug', trabalhoSeg: 45 },
    ]);
    expect(decoded?.objetivo).toBeUndefined();
  });

  it('retorna null para entradas inválidas', () => {
    expect(decodeSequence({})).toBeNull();
    expect(decodeSequence(parseQueryString('qualquer coisa'))).toBeNull();
    expect(decodeSequence({ i: 'x.1,y.2' })).toBeNull();
    expect(parseQueryString('a=%E0%A4%A&b=ok')).toEqual({ b: 'ok' });
  });
});

describe('progressão de mobilidade', () => {
  const protocol = ASSESSMENT_BY_ID['joelho-parede'];
  const entry = (id: string, data: string, valor: number, extra: Partial<AssessmentEntry> = {}): AssessmentEntry => ({
    id,
    protocoloId: 'joelho-parede',
    data,
    valor,
    valorEsquerdo: valor,
    periodo: 'manha',
    aquecido: false,
    ...extra,
  });

  it('compara apenas avaliações feitas em condições semelhantes', () => {
    const entries = [
      entry('a', '2026-01-01', 8),
      entry('b', '2026-02-01', 12, { periodo: 'noite' }),
      entry('c', '2026-03-01', 10),
    ];
    const s = summarize(entries, protocol);
    expect(s.ultimo?.id).toBe('c');
    expect(s.referencia?.id).toBe('a');
    expect(s.evolucao).toBe(2);
    expect(s.total).toBe(3);
  });

  it('inverte o sentido quando menor é melhor', () => {
    const bracos = ASSESSMENT_BY_ID['bracos-parede'];
    const entries: AssessmentEntry[] = [
      { id: '1', protocoloId: 'bracos-parede', data: '2026-01-01', valor: 10, periodo: 'tarde', aquecido: true },
      { id: '2', protocoloId: 'bracos-parede', data: '2026-02-01', valor: 6, periodo: 'tarde', aquecido: true },
    ];
    expect(summarize(entries, bracos).evolucao).toBe(4);
  });

  it('sem avaliação comparável, não calcula evolução', () => {
    const s = summarize([entry('a', '2026-01-01', 8), entry('b', '2026-02-01', 9, { aquecido: true })], protocol);
    expect(s.evolucao).toBeUndefined();
  });

  it('formata valores e assimetria', () => {
    expect(formatValue(9.5, protocol)).toBe('9,5 cm');
    expect(formatValue(2, ASSESSMENT_BY_ID['agachamento-profundo'])).toBe('2 pontos');
    expect(asymmetry(entry('a', '2026-01-01', 8, { valorEsquerdo: 5 }))).toBe(3);
  });
});

describe('métricas do teste com usuários', () => {
  it('resume tempo até encontrar, filtros e sequências', () => {
    const events: MetricEvent[] = [
      { t: 0, tipo: 'sessao_inicio', sessao: 's1' },
      { t: 5_000, tipo: 'filtro', sessao: 's1', dados: { filtro: 'regiao' } },
      { t: 9_000, tipo: 'exercicio_visto', sessao: 's1', dados: { compativel: false } },
      { t: 20_000, tipo: 'exercicio_visto', sessao: 's1', dados: { compativel: true } },
      { t: 100_000, tipo: 'sessao_inicio', sessao: 's2' },
      { t: 140_000, tipo: 'exercicio_visto', sessao: 's2', dados: { compativel: true } },
      { t: 150_000, tipo: 'filtro', sessao: 's2', dados: { filtro: 'regiao' } },
      { t: 160_000, tipo: 'sequencia_gerada', sessao: 's2' },
      { t: 170_000, tipo: 'sequencia_iniciada', sessao: 's2' },
    ];
    const s = summarizeMetrics(events, [{ t: 1, voltaria: 4, pagaria: 'talvez', recursos: [] }]);
    expect(s.sessoes).toBe(2);
    expect(s.encontrouCompativel).toBe(true);
    expect(s.tempoAteEncontrarSeg).toBe(30); // mediana de 20 s e 40 s
    expect(s.filtrosUsados).toEqual({ regiao: 2 });
    expect(s.sequenciasGeradas).toBe(1);
    expect(s.sequenciasIniciadas).toBe(1);
    expect(s.sequenciasConcluidas).toBe(0);
    expect(s.feedback?.voltaria).toBe(4);
  });
});
