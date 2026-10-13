import { EXERCISES, EXERCISE_BY_ID } from '../../data/exercises';
import {
  EQUIPMENT,
  EQUIPMENT_BY_ID,
  EQUIP_CATEGORIES,
  OBJECTIVES,
  OBJECTIVE_BY_ID,
  REGIONS,
  REGION_BY_ID,
} from '../../data/taxonomy';
import type { EquipId } from '../../data/types';
import {
  describeMissing,
  equipmentUsed,
  filterExercises,
  findAlternatives,
  isCompatible,
  missingRequirements,
  unlockSuggestions,
} from '../catalog';
import { normalize } from '../text';

const ALL_EQUIPMENT = EQUIPMENT.map((e) => e.id);

describe('catálogo inicial', () => {
  it('tem cerca de 40 exercícios ou mais, com IDs únicos', () => {
    expect(EXERCISES.length).toBeGreaterThanOrEqual(40);
    expect(new Set(EXERCISES.map((e) => e.id)).size).toBe(EXERCISES.length);
  });

  it.each(EXERCISES.map((e) => [e.id, e] as const))('%s tem metadados completos e válidos', (_id, ex) => {
    expect(ex.nome.length).toBeGreaterThan(3);
    expect(ex.regioes.length).toBeGreaterThan(0);
    expect(ex.objetivos.length).toBeGreaterThan(0);
    ex.regioes.forEach((r) => expect(REGION_BY_ID[r]).toBeDefined());
    ex.objetivos.forEach((o) => expect(OBJECTIVE_BY_ID[o]).toBeDefined());
    equipmentUsed(ex).forEach((e) => expect(EQUIPMENT_BY_ID[e]).toBeDefined());
    ex.requisitos.forEach((slot) => expect(slot.length).toBeGreaterThan(0));
    expect(ex.instrucoes.length).toBeGreaterThanOrEqual(3);
    expect(ex.adaptacoes.length).toBeGreaterThan(0);
    expect(ex.limitacoes.length).toBeGreaterThan(0);
    expect(ex.musculos.length).toBeGreaterThan(0);
    expect(ex.dosagem.length).toBeGreaterThan(0);
    expect(ex.duracaoSeg).toBeGreaterThanOrEqual(20);
    expect(ex.familia).toMatch(/^[a-z0-9-]+$/);
    expect(['revisado', 'em_revisao', 'pendente']).toContain(ex.revisao.status);
  });

  it('cobre todas as categorias de acessórios, regiões e objetivos', () => {
    for (const cat of EQUIP_CATEGORIES) {
      expect(filterExercises({ categorias: [cat.id] }, []).length).toBeGreaterThan(0);
    }
    expect(filterExercises({ categorias: ['sem'] }, []).length).toBeGreaterThanOrEqual(10);
    for (const r of REGIONS) {
      expect(filterExercises({ regioes: [r.id] }, []).length).toBeGreaterThan(0);
    }
    for (const o of OBJECTIVES) {
      expect(filterExercises({ objetivos: [o.id] }, []).length).toBeGreaterThanOrEqual(3);
    }
  });

  it('não marca nada como revisado sem revisor identificado', () => {
    for (const ex of EXERCISES) {
      if (ex.revisao.status === 'revisado') {
        expect(ex.revisao.revisor).toBeTruthy();
        expect(ex.revisao.data).toBeTruthy();
      }
    }
  });
});

describe('compatibilidade com o kit', () => {
  it('sem acessórios, só mostra exercícios de peso corporal', () => {
    const result = filterExercises({ somenteCompativeis: true }, []);
    expect(result.length).toBeGreaterThan(0);
    result.forEach((ex) => expect(ex.requisitos).toEqual([]));
  });

  it('com todos os acessórios, tudo é compatível', () => {
    expect(filterExercises({ somenteCompativeis: true }, ALL_EQUIPMENT)).toHaveLength(EXERCISES.length);
  });

  it('qualquer opção de um requisito atende (bolinha OU bola pequena)', () => {
    const ex = EXERCISE_BY_ID['bolinha-planta-pe'];
    expect(isCompatible(ex, ['bola_pequena'])).toBe(true);
    expect(isCompatible(ex, ['bolinha_massagem'])).toBe(true);
    expect(isCompatible(ex, ['rolo_espuma'])).toBe(false);
  });

  it('todos os requisitos precisam ser atendidos (bolinha E parede)', () => {
    const ex = EXERCISE_BY_ID['bolinha-escapular-parede'];
    expect(missingRequirements(ex, ['bolinha_massagem'])).toEqual([['parede']]);
    expect(isCompatible(ex, ['bolinha_massagem', 'parede'])).toBe(true);
    expect(describeMissing(ex, [])).toBe('Bolinha de massagem ou Bola pequena + Parede');
  });

  it('ordena compatíveis antes dos incompatíveis', () => {
    const result = filterExercises({ regioes: ['tornozelo'] }, ['faixa_longa']);
    const firstIncompatible = result.findIndex((ex) => !isCompatible(ex, ['faixa_longa']));
    const lastCompatible = result.map((ex) => isCompatible(ex, ['faixa_longa'])).lastIndexOf(true);
    expect(lastCompatible).toBeLessThan(firstIncompatible);
  });
});

describe('busca', () => {
  it('ignora acentos e maiúsculas', () => {
    expect(normalize('Quadríceps ÇÃO')).toBe('quadriceps cao');
    const ids = filterExercises({ busca: 'quadriceps' }, []).map((e) => e.id);
    expect(ids).toContain('rolo-quadriceps');
  });

  it('encontra pelo nome do músculo', () => {
    const ids = filterExercises({ busca: 'glúteo médio' }, []).map((e) => e.id);
    expect(ids).toEqual(expect.arrayContaining(['miniband-ostra', 'ostra', 'miniband-passada-lateral']));
  });

  it('encontra por nome alternativo', () => {
    expect(filterExercises({ busca: 'bird dog' }, []).map((e) => e.id)).toContain('perdigueiro');
  });
});

describe('substituição inteligente de acessórios', () => {
  it('exemplo do documento: tornozelo só com faixa elástica', () => {
    const kit: EquipId[] = ['faixa_longa'];
    const found = filterExercises({ regioes: ['tornozelo'], somenteCompativeis: true }, kit).map((e) => e.id);
    expect(found).toContain('faixa-dorsiflexao');
    expect(found).not.toContain('joelho-parede');

    const { equivalentes } = findAlternatives(EXERCISE_BY_ID['joelho-parede'], kit);
    const ids = equivalentes.map((e) => e.id);
    expect(ids).toContain('faixa-dorsiflexao');
    expect(ids).toContain('dorsiflexao-ajoelhado');
  });

  it('equivalentes são sempre da mesma família e compatíveis com o kit', () => {
    const kits: EquipId[][] = [[], ['parede'], ['faixa_longa', 'miniband'], ['rolo_espuma', 'bastao']];
    for (const kit of kits) {
      for (const ex of EXERCISES) {
        const { equivalentes, relacionados } = findAlternatives(ex, kit);
        equivalentes.forEach((alt) => {
          expect(alt.familia).toBe(ex.familia);
          expect(alt.id).not.toBe(ex.id);
          expect(isCompatible(alt, kit)).toBe(true);
        });
        relacionados.forEach((alt) => {
          expect(alt.familia).not.toBe(ex.familia);
          expect(alt.tipo).toBe(ex.tipo);
        });
      }
    }
  });

  it('não sugere liberação como substituto de mobilidade', () => {
    const { equivalentes, relacionados } = findAlternatives(EXERCISE_BY_ID['joelho-parede'], ALL_EQUIPMENT);
    [...equivalentes, ...relacionados].forEach((alt) => expect(alt.tipo).not.toBe('liberacao'));
  });

  it('sugere equipamentos que liberam mais exercícios', () => {
    const suggestions = unlockSuggestions([]);
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions[0].libera).toBeGreaterThanOrEqual(suggestions[suggestions.length - 1].libera);
    expect(suggestions.map((s) => s.equip)).toContain('parede');
  });
});
