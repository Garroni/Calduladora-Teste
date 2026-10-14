import type {
  Difficulty,
  EquipCategoryId,
  EquipId,
  MovementType,
  ObjectiveId,
  RegionId,
  ReviewStatus,
} from './types';

export interface EquipmentInfo {
  id: EquipId;
  nome: string;
  categoria: EquipCategoryId;
  icone: string;
}

export const EQUIPMENT: EquipmentInfo[] = [
  { id: 'bola_suica', nome: 'Bola suíça', categoria: 'bolas', icone: 'basketball' },
  { id: 'bola_pequena', nome: 'Bola pequena', categoria: 'bolas', icone: 'volleyball' },
  { id: 'bolinha_massagem', nome: 'Bolinha de massagem', categoria: 'bolas', icone: 'tennis-ball' },
  { id: 'rolo_espuma', nome: 'Rolo de espuma', categoria: 'rolos', icone: 'cylinder' },
  { id: 'rolo_pequeno', nome: 'Rolo pequeno', categoria: 'rolos', icone: 'cylinder' },
  { id: 'faixa_longa', nome: 'Faixa elástica longa', categoria: 'elasticos', icone: 'jump-rope' },
  { id: 'miniband', nome: 'Miniband', categoria: 'elasticos', icone: 'circle-outline' },
  { id: 'faixa_alongamento', nome: 'Faixa de alongamento', categoria: 'elasticos', icone: 'ray-start-end' },
  { id: 'colchonete', nome: 'Colchonete', categoria: 'solo', icone: 'rug' },
  { id: 'bastao', nome: 'Bastão', categoria: 'bastoes', icone: 'minus-thick' },
  { id: 'parede', nome: 'Parede', categoria: 'apoios', icone: 'wall' },
  { id: 'cadeira', nome: 'Cadeira', categoria: 'apoios', icone: 'seat' },
  { id: 'banco', nome: 'Banco', categoria: 'apoios', icone: 'bench' },
  { id: 'degrau', nome: 'Degrau', categoria: 'apoios', icone: 'stairs' },
];

export const EQUIPMENT_BY_ID: Record<EquipId, EquipmentInfo> = Object.fromEntries(
  EQUIPMENT.map((e) => [e.id, e]),
) as Record<EquipId, EquipmentInfo>;

export const EQUIP_CATEGORIES: { id: EquipCategoryId; nome: string; descricao: string }[] = [
  { id: 'bolas', nome: 'Bolas', descricao: 'Bola suíça, bola pequena e bolinha de massagem' },
  { id: 'rolos', nome: 'Rolos', descricao: 'Rolo de espuma e rolos menores' },
  { id: 'elasticos', nome: 'Elásticos', descricao: 'Faixa longa, miniband e faixa de alongamento' },
  { id: 'solo', nome: 'Solo', descricao: 'Colchonete para mobilidade ativa, controle e Pilates' },
  { id: 'bastoes', nome: 'Bastões', descricao: 'Ombros, coluna torácica e quadril' },
  { id: 'apoios', nome: 'Apoios', descricao: 'Parede, cadeira, banco e degrau' },
];

export interface RegionInfo {
  id: RegionId;
  nome: string;
  curto: string;
}

export const REGIONS: RegionInfo[] = [
  { id: 'tornozelo', nome: 'Tornozelos e pés', curto: 'Tornozelos' },
  { id: 'quadril', nome: 'Quadril e coxas', curto: 'Quadril' },
  { id: 'lombar', nome: 'Lombar e core', curto: 'Lombar' },
  { id: 'toracica', nome: 'Coluna torácica', curto: 'Torácica' },
  { id: 'ombro', nome: 'Ombros', curto: 'Ombros' },
  { id: 'cervical', nome: 'Pescoço', curto: 'Pescoço' },
  { id: 'punho', nome: 'Punhos', curto: 'Punhos' },
  { id: 'corpo_inteiro', nome: 'Corpo inteiro', curto: 'Corpo inteiro' },
];

export const REGION_BY_ID: Record<RegionId, RegionInfo> = Object.fromEntries(
  REGIONS.map((r) => [r.id, r]),
) as Record<RegionId, RegionInfo>;

export interface ObjectiveInfo {
  id: ObjectiveId;
  nome: string;
  descricao: string;
  icone: string;
  /** Regiões que mais contribuem para o objetivo. */
  regioesAlvo: RegionId[];
}

export const OBJECTIVES: ObjectiveInfo[] = [
  {
    id: 'pre_treino',
    nome: 'Preparação para treino',
    descricao: 'Aquecimento articular antes da musculação ou do treino funcional.',
    icone: 'dumbbell',
    regioesAlvo: ['quadril', 'toracica', 'ombro', 'tornozelo', 'corpo_inteiro'],
  },
  {
    id: 'agachamento',
    nome: 'Preparação para agachamento',
    descricao: 'Tornozelos, quadril e coluna torácica prontos para agachar com amplitude.',
    icone: 'weight-lifter',
    regioesAlvo: ['tornozelo', 'quadril', 'toracica'],
  },
  {
    id: 'overhead',
    nome: 'Ombros acima da cabeça',
    descricao: 'Mobilidade de ombros e torácica para movimentos acima da cabeça.',
    icone: 'human-handsup',
    regioesAlvo: ['ombro', 'toracica'],
  },
  {
    id: 'corrida',
    nome: 'Preparação para corrida',
    descricao: 'Tornozelos, panturrilhas e quadril ativos antes de correr.',
    icone: 'run',
    regioesAlvo: ['tornozelo', 'quadril', 'lombar'],
  },
  {
    id: 'quadril',
    nome: 'Mobilidade de quadril',
    descricao: 'Rotação, flexão e extensão de quadril com controle.',
    icone: 'yoga',
    regioesAlvo: ['quadril', 'lombar'],
  },
  {
    id: 'toracica',
    nome: 'Mobilidade torácica',
    descricao: 'Extensão e rotação da parte média das costas.',
    icone: 'rotate-3d-variant',
    regioesAlvo: ['toracica', 'ombro'],
  },
  {
    id: 'controle',
    nome: 'Controle e estabilidade',
    descricao: 'Ativação e controle motor na amplitude que você já tem.',
    icone: 'target',
    regioesAlvo: ['lombar', 'quadril', 'ombro'],
  },
  {
    id: 'amplitude',
    nome: 'Amplitude de movimento',
    descricao: 'Mobilidade geral para ganhar amplitude com calma.',
    icone: 'meditation',
    regioesAlvo: ['quadril', 'toracica', 'ombro', 'tornozelo', 'lombar', 'cervical'],
  },
];

export const OBJECTIVE_BY_ID: Record<ObjectiveId, ObjectiveInfo> = Object.fromEntries(
  OBJECTIVES.map((o) => [o.id, o]),
) as Record<ObjectiveId, ObjectiveInfo>;

export const MOVEMENT_TYPES: { id: MovementType; nome: string; descricao: string }[] = [
  { id: 'liberacao', nome: 'Liberação', descricao: 'Automassagem com bola ou rolo' },
  { id: 'mobilidade', nome: 'Mobilidade ativa', descricao: 'Movimento controlado na amplitude' },
  { id: 'alongamento', nome: 'Alongamento', descricao: 'Posição sustentada com respiração' },
  { id: 'controle', nome: 'Controle', descricao: 'Ativação e estabilidade' },
  { id: 'integracao', nome: 'Integração', descricao: 'Padrão de movimento completo' },
];

export const MOVEMENT_TYPE_BY_ID = Object.fromEntries(MOVEMENT_TYPES.map((m) => [m.id, m])) as Record<
  MovementType,
  (typeof MOVEMENT_TYPES)[number]
>;

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  1: 'Iniciante',
  2: 'Intermediário',
  3: 'Avançado',
};

export const REVIEW_LABEL: Record<ReviewStatus, { titulo: string; descricao: string }> = {
  revisado: {
    titulo: 'Revisado por profissional',
    descricao: 'Instruções conferidas por profissional habilitado.',
  },
  em_revisao: {
    titulo: 'Em revisão técnica',
    descricao: 'Um profissional está conferindo este conteúdo.',
  },
  pendente: {
    titulo: 'Aguardando validação técnica',
    descricao:
      'Conteúdo de protótipo, ainda não revisado por profissional. Use com cautela e respeite seus limites.',
  },
};
