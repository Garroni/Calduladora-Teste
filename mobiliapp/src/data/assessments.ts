import type { EquipId, RegionId } from './types';

export type AssessmentUnit = 'cm' | 'pontos';

export interface AssessmentProtocol {
  id: string;
  nome: string;
  regiao: RegionId;
  unidade: AssessmentUnit;
  /** Registra lado direito e esquerdo separadamente. */
  bilateral: boolean;
  /** true quando um valor maior representa mais mobilidade. */
  maiorMelhor: boolean;
  min: number;
  max: number;
  passo: number;
  equipamentos: EquipId[];
  materiais: string;
  resumo: string;
  passos: string[];
  comoMedir: string;
  escala?: { valor: number; descricao: string }[];
}

export const ASSESSMENTS: AssessmentProtocol[] = [
  {
    id: 'joelho-parede',
    nome: 'Teste do joelho na parede',
    regiao: 'tornozelo',
    unidade: 'cm',
    bilateral: true,
    maiorMelhor: true,
    min: 0,
    max: 20,
    passo: 0.5,
    equipamentos: ['parede'],
    materiais: 'Parede e fita métrica ou régua',
    resumo: 'Amplitude de dorsiflexão do tornozelo com o pé apoiado.',
    passos: [
      'Descalço, fique de frente para a parede com o pé apontando para ela.',
      'Leve o joelho até tocar a parede, sem tirar o calcanhar do chão.',
      'Afaste o pé aos poucos até a maior distância em que o joelho ainda toca a parede com o calcanhar apoiado.',
      'Meça a distância entre a ponta do dedão e a parede.',
    ],
    comoMedir: 'Distância do dedão até a parede, em centímetros.',
  },
  {
    id: 'bracos-parede',
    nome: 'Braços acima da cabeça na parede',
    regiao: 'ombro',
    unidade: 'cm',
    bilateral: false,
    maiorMelhor: false,
    min: 0,
    max: 40,
    passo: 0.5,
    equipamentos: ['parede'],
    materiais: 'Parede e fita métrica ou régua',
    resumo: 'Alcance dos braços acima da cabeça sem compensar com a lombar.',
    passos: [
      'Encoste quadril, costas e cabeça na parede, com os pés a um palmo dela e os joelhos levemente dobrados.',
      'Mantenha a lombar próxima da parede, sem arquear.',
      'Eleve os braços estendidos à frente e acima da cabeça, polegares para trás.',
      'Meça a distância entre os polegares e a parede no ponto mais alto.',
    ],
    comoMedir: 'Distância dos polegares até a parede, em centímetros. Zero = encostou.',
  },
  {
    id: 'sentar-alcancar',
    nome: 'Sentar e alcançar',
    regiao: 'quadril',
    unidade: 'cm',
    bilateral: false,
    maiorMelhor: true,
    min: -30,
    max: 30,
    passo: 0.5,
    equipamentos: [],
    materiais: 'Chão e fita métrica ou régua',
    resumo: 'Flexibilidade da cadeia posterior (posterior de coxa e costas).',
    passos: [
      'Sente no chão com as pernas estendidas e as solas dos pés juntas, encostadas em uma parede ou caixa.',
      'Coloque uma mão sobre a outra, com os dedos médios alinhados.',
      'Expire e incline o tronco à frente devagar, sem dobrar os joelhos e sem dar impulso.',
      'Segure 2 segundos no ponto mais distante e meça a posição dos dedos em relação aos pés.',
    ],
    comoMedir:
      'Distância em centímetros entre a ponta dos dedos e a sola dos pés. Antes dos pés = negativo; além = positivo.',
  },
  {
    id: 'agachamento-profundo',
    nome: 'Agachamento profundo (escala 0–3)',
    regiao: 'corpo_inteiro',
    unidade: 'pontos',
    bilateral: false,
    maiorMelhor: true,
    min: 0,
    max: 3,
    passo: 1,
    equipamentos: [],
    materiais: 'Espaço livre; opcionalmente um celular para filmar de lado',
    resumo: 'Avaliação qualitativa simples da posição de agachamento profundo.',
    passos: [
      'Fique com os pés na largura dos ombros e os braços estendidos à frente.',
      'Agache o mais fundo que conseguir, devagar, sem dor.',
      'Observe (ou filme de lado) a posição mais baixa.',
      'Escolha a descrição da escala que melhor representa o que você viu.',
    ],
    comoMedir: 'Pontuação de 0 a 3 conforme a escala abaixo.',
    escala: [
      { valor: 0, descricao: 'Senti dor durante o movimento.' },
      { valor: 1, descricao: 'Não consegui descer até a coxa paralela ao chão.' },
      { valor: 2, descricao: 'Desci abaixo do paralelo, mas os calcanhares saíram ou o tronco caiu muito à frente.' },
      { valor: 3, descricao: 'Desci abaixo do paralelo com calcanhares no chão e tronco estável.' },
    ],
  },
];

export const ASSESSMENT_BY_ID: Record<string, AssessmentProtocol> = Object.fromEntries(
  ASSESSMENTS.map((a) => [a.id, a]),
);

export type TimeOfDay = 'manha' | 'tarde' | 'noite';

export const TIME_OF_DAY_LABEL: Record<TimeOfDay, string> = {
  manha: 'Manhã',
  tarde: 'Tarde',
  noite: 'Noite',
};

export interface AssessmentEntry {
  id: string;
  protocoloId: string;
  data: string;
  /** Valor único ou lado direito, quando bilateral. */
  valor: number;
  valorEsquerdo?: number;
  periodo: TimeOfDay;
  aquecido: boolean;
  observacao?: string;
}
