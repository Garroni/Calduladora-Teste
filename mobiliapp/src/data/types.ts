export type EquipId =
  | 'bola_suica'
  | 'bola_pequena'
  | 'bolinha_massagem'
  | 'rolo_espuma'
  | 'rolo_pequeno'
  | 'faixa_longa'
  | 'miniband'
  | 'faixa_alongamento'
  | 'colchonete'
  | 'bastao'
  | 'parede'
  | 'cadeira'
  | 'banco'
  | 'degrau';

export type EquipCategoryId = 'bolas' | 'rolos' | 'elasticos' | 'solo' | 'bastoes' | 'apoios';

export type RegionId =
  | 'tornozelo'
  | 'quadril'
  | 'lombar'
  | 'toracica'
  | 'ombro'
  | 'cervical'
  | 'punho'
  | 'corpo_inteiro';

export type ObjectiveId =
  | 'pre_treino'
  | 'agachamento'
  | 'overhead'
  | 'corrida'
  | 'quadril'
  | 'toracica'
  | 'controle'
  | 'amplitude';

/** Tipo de movimento. Também define a fase em que o exercício entra numa sequência. */
export type MovementType = 'liberacao' | 'mobilidade' | 'alongamento' | 'controle' | 'integracao';

export type Difficulty = 1 | 2 | 3;

export type ReviewStatus = 'revisado' | 'em_revisao' | 'pendente';

export interface Review {
  status: ReviewStatus;
  revisor?: string;
  registroProfissional?: string;
  data?: string;
}

export interface Exercise {
  id: string;
  nome: string;
  outrosNomes?: string[];
  regioes: RegionId[];
  objetivos: ObjectiveId[];
  /**
   * Equipamentos necessários: cada item da lista é um requisito, e cada requisito
   * é atendido por QUALQUER um dos equipamentos listados nele.
   * Lista vazia = sem acessórios.
   */
  requisitos: EquipId[][];
  /** Ajudam, mas não são obrigatórios (ex.: colchonete). */
  opcionais?: EquipId[];
  dificuldade: Difficulty;
  /** Duração estimada de uma série, em segundos (por lado, se unilateral). */
  duracaoSeg: number;
  unilateral: boolean;
  tipo: MovementType;
  musculos: string[];
  /**
   * Grupo de equivalência funcional. Exercícios da mesma família cumprem a mesma
   * finalidade e podem substituir uns aos outros sem trocar o padrão de movimento.
   */
  familia: string;
  dosagem: string;
  instrucoes: string[];
  dicas?: string[];
  adaptacoes: string[];
  limitacoes: string[];
  videoUrl?: string;
  revisao: Review;
}

export interface SequenceItem {
  exerciseId: string;
  /** Tempo de trabalho por lado, em segundos. */
  trabalhoSeg: number;
}

export type SequenceOrigin = 'gerada' | 'manual' | 'importada';

export interface Sequence {
  id: string;
  nome: string;
  criadaEm: string;
  atualizadaEm: string;
  origem: SequenceOrigin;
  objetivo?: ObjectiveId;
  regiao?: RegionId;
  tempoAlvoMin?: number;
  itens: SequenceItem[];
  /** Observações do profissional para o aluno. */
  notas?: string;
  autor?: string;
  modelo?: boolean;
}
