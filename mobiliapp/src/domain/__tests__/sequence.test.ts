import { EXERCISE_BY_ID } from '../../data/exercises';
import { EQUIPMENT, OBJECTIVES, REGIONS } from '../../data/taxonomy';
import type { Difficulty, EquipId } from '../../data/types';
import { isCompatible } from '../catalog';
import {
  PHASE_ORDER,
  PHASE_PROFILE,
  PREPARO_INICIAL_SEG,
  adaptToKit,
  buildSequence,
  buildSteps,
  sequenceSeconds,
} from '../sequence';

const ALL: EquipId[] = EQUIPMENT.map((e) => e.id);
const KITS: Record<string, EquipId[]> = {
  'sem acessórios': [],
  'só faixa': ['faixa_longa'],
  casa: ['colchonete', 'parede', 'cadeira', 'bolinha_massagem'],
  academia: ALL,
};

describe('montador de sequências', () => {
  for (const [kitName, kit] of Object.entries(KITS)) {
    for (const objetivo of OBJECTIVES) {
      for (const minutos of [5, 10, 15]) {
        it(`${objetivo.id} · ${minutos} min · ${kitName}`, () => {
          const nivel: Difficulty = 3;
          const out = buildSequence({ kit, objetivo: objetivo.id, minutos, nivel });
          expect(out.itens.length).toBeGreaterThan(0);

          const exercises = out.itens.map((i) => EXERCISE_BY_ID[i.exerciseId]);
          // Tudo compatível com o kit e dentro do nível.
          exercises.forEach((ex) => {
            expect(isCompatible(ex, kit)).toBe(true);
            expect(ex.dificuldade).toBeLessThanOrEqual(nivel);
            // Só entram tipos de movimento previstos para o objetivo.
            expect(PHASE_PROFILE[objetivo.id][ex.tipo] ?? 0).toBeGreaterThan(0);
          });
          // Nenhuma família funcional repetida.
          expect(new Set(exercises.map((e) => e.familia)).size).toBe(exercises.length);
          // Fases em ordem: liberação → mobilidade → alongamento → controle → integração.
          const phaseIdx = exercises.map((e) => PHASE_ORDER.indexOf(e.tipo));
          expect([...phaseIdx].sort((a, b) => a - b)).toEqual(phaseIdx);
          // Tempo total próximo do escolhido (ou aviso explicando por que ficou curto).
          const total = sequenceSeconds(out.itens);
          expect(out.totalSeg).toBe(total);
          expect(total).toBeLessThanOrEqual(minutos * 60 * 1.1);
          if (total < minutos * 60 * 0.85) expect(out.avisos.length).toBeGreaterThan(0);
        });
      }
    }
  }

  it('preparação para treino não inclui alongamento estático sustentado', () => {
    const out = buildSequence({ kit: ALL, objetivo: 'pre_treino', minutos: 15, nivel: 3 });
    out.itens.forEach((i) => expect(EXERCISE_BY_ID[i.exerciseId].tipo).not.toBe('alongamento'));
  });

  it('respeita a região escolhida', () => {
    for (const region of REGIONS.filter((r) => r.id !== 'corpo_inteiro')) {
      const out = buildSequence({ kit: ALL, objetivo: 'amplitude', regiao: region.id, minutos: 5, nivel: 3 });
      const inRegion = out.itens.filter((i) => EXERCISE_BY_ID[i.exerciseId].regioes.includes(region.id));
      expect(inRegion.length).toBeGreaterThan(0);
    }
  });

  it('cobre as regiões-alvo do objetivo', () => {
    const out = buildSequence({ kit: ALL, objetivo: 'agachamento', minutos: 10, nivel: 3 });
    const regions = new Set(out.itens.flatMap((i) => EXERCISE_BY_ID[i.exerciseId].regioes));
    expect(regions.has('tornozelo')).toBe(true);
    expect(regions.has('quadril')).toBe(true);
    expect(regions.has('toracica')).toBe(true);
  });

  it('respeita o nível do usuário', () => {
    const out = buildSequence({ kit: ALL, objetivo: 'controle', minutos: 15, nivel: 1 });
    out.itens.forEach((i) => expect(EXERCISE_BY_ID[i.exerciseId].dificuldade).toBe(1));
  });

  it('é determinístico para a mesma semente e varia entre sementes', () => {
    const input = { kit: ALL, objetivo: 'pre_treino' as const, minutos: 10, nivel: 3 as const };
    expect(buildSequence({ ...input, seed: 7 })).toEqual(buildSequence({ ...input, seed: 7 }));
    const variants = new Set(
      [1, 2, 3, 4, 5, 6].map((seed) =>
        buildSequence({ ...input, seed })
          .itens.map((i) => i.exerciseId)
          .join(','),
      ),
    );
    expect(variants.size).toBeGreaterThan(1);
  });

  it('avisa quando não há liberação possível no kit', () => {
    const out = buildSequence({ kit: [], objetivo: 'amplitude', minutos: 10, nivel: 3 });
    expect(out.avisos.join(' ')).toMatch(/libera/);
  });
});

describe('adaptação de rotina ao kit', () => {
  it('troca exercícios incompatíveis por equivalentes', () => {
    const itens = [
      { exerciseId: 'joelho-parede', trabalhoSeg: 40 },
      { exerciseId: 'bastao-passagem-ombros', trabalhoSeg: 45 },
      { exerciseId: 'gato-vaca', trabalhoSeg: 45 },
    ];
    const kit: EquipId[] = ['faixa_longa'];
    const result = adaptToKit(itens, kit);
    const ids = result.itens.map((i) => i.exerciseId);
    expect(ids).toContain('gato-vaca');
    expect(ids).toContain('faixa-passagem-ombros');
    expect(ids).not.toContain('joelho-parede');
    expect(ids).not.toContain('bastao-passagem-ombros');
    result.itens.forEach((i) => expect(isCompatible(EXERCISE_BY_ID[i.exerciseId], kit)).toBe(true));
    expect(result.trocas).toHaveLength(2);
    expect(result.semAlternativa).toEqual([]);
  });

  it('informa quando não há equivalente', () => {
    const result = adaptToKit([{ exerciseId: 'rolo-quadriceps', trabalhoSeg: 45 }], []);
    expect(result.semAlternativa).toEqual(['rolo-quadriceps']);
    expect(result.itens[0].exerciseId).toBe('rolo-quadriceps');
  });
});

describe('linha do tempo do player', () => {
  it('divide exercícios unilaterais por lado e soma o tempo corretamente', () => {
    const itens = [
      { exerciseId: 'gato-vaca', trabalhoSeg: 45 },
      { exerciseId: 'joelho-parede', trabalhoSeg: 30 },
    ];
    const steps = buildSteps(itens);
    expect(steps.map((s) => s.kind)).toEqual([
      'preparo',
      'trabalho',
      'transicao',
      'trabalho',
      'troca_lado',
      'trabalho',
    ]);
    const total = steps.reduce((s, st) => s + st.seg, 0);
    expect(total).toBe(PREPARO_INICIAL_SEG + sequenceSeconds(itens));
  });
});
