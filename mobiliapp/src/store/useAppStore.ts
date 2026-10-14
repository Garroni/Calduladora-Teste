import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { AssessmentEntry } from '../data/assessments';
import type { Difficulty, EquipId, Sequence, SequenceItem } from '../data/types';
import type { FeedbackAnswer, MetricEvent, MetricEventType } from '../domain/metrics';
import { newId } from '../domain/text';

/** Identifica a sessão atual de uso (para as métricas de validação). */
export const SESSION_ID = newId('s');

export interface CompletedSession {
  id: string;
  nome: string;
  data: string;
  duracaoSeg: number;
  exercicios: number;
}

export interface DraftInfo {
  avisos: string[];
  /** Semente usada pelo montador (para "gerar outra opção"). */
  seed?: number;
  minutos?: number;
}

interface PersistedState {
  onboarded: boolean;
  kit: EquipId[];
  nivel: Difficulty;
  modoPro: boolean;
  nomeProfissional: string;
  rotinas: Sequence[];
  rascunho: Sequence | null;
  rascunhoInfo: DraftInfo | null;
  avaliacoes: AssessmentEntry[];
  historico: CompletedSession[];
  favoritos: string[];
  validacaoAtiva: boolean;
  eventos: MetricEvent[];
  respostas: FeedbackAnswer[];
}

interface Actions {
  concluirOnboarding: () => void;
  setKit: (kit: EquipId[]) => void;
  toggleEquip: (equip: EquipId) => void;
  setNivel: (nivel: Difficulty) => void;
  setModoPro: (ativo: boolean) => void;
  setNomeProfissional: (nome: string) => void;

  setRascunho: (seq: Sequence | null, info?: DraftInfo | null) => void;
  updateRascunho: (patch: Partial<Sequence>) => void;
  setRascunhoItens: (itens: SequenceItem[]) => void;
  salvarRascunho: () => Sequence | null;
  salvarRotina: (seq: Sequence) => void;
  removerRotina: (id: string) => void;
  editarRotina: (id: string) => void;

  addAvaliacao: (entry: AssessmentEntry) => void;
  removerAvaliacao: (id: string) => void;

  registrarSessao: (sessao: CompletedSession) => void;
  toggleFavorito: (id: string) => void;

  setValidacaoAtiva: (ativo: boolean) => void;
  track: (tipo: MetricEventType, dados?: MetricEvent['dados']) => void;
  addResposta: (resposta: FeedbackAnswer) => void;
  limparMetricas: () => void;
  resetTudo: () => void;
}

export type AppState = PersistedState & Actions & { hydrated: boolean };

const INITIAL: PersistedState = {
  onboarded: false,
  kit: [],
  nivel: 1,
  modoPro: false,
  nomeProfissional: '',
  rotinas: [],
  rascunho: null,
  rascunhoInfo: null,
  avaliacoes: [],
  historico: [],
  favoritos: [],
  validacaoAtiva: false,
  eventos: [],
  respostas: [],
};

const MAX_EVENTOS = 5000;

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...INITIAL,
      hydrated: false,

      concluirOnboarding: () => set({ onboarded: true }),
      setKit: (kit) => set({ kit }),
      toggleEquip: (equip) =>
        set((s) => ({
          kit: s.kit.includes(equip) ? s.kit.filter((e) => e !== equip) : [...s.kit, equip],
        })),
      setNivel: (nivel) => set({ nivel }),
      setModoPro: (modoPro) => set({ modoPro }),
      setNomeProfissional: (nomeProfissional) => set({ nomeProfissional }),

      setRascunho: (rascunho, info = null) => set({ rascunho, rascunhoInfo: info }),
      updateRascunho: (patch) =>
        set((s) =>
          s.rascunho
            ? { rascunho: { ...s.rascunho, ...patch, atualizadaEm: new Date().toISOString() } }
            : {},
        ),
      setRascunhoItens: (itens) => get().updateRascunho({ itens }),
      salvarRascunho: () => {
        const { rascunho } = get();
        if (!rascunho || rascunho.itens.length === 0) return null;
        const saved: Sequence = { ...rascunho, atualizadaEm: new Date().toISOString() };
        get().salvarRotina(saved);
        return saved;
      },
      salvarRotina: (seq) =>
        set((s) => {
          const exists = s.rotinas.some((r) => r.id === seq.id);
          return {
            rotinas: exists ? s.rotinas.map((r) => (r.id === seq.id ? seq : r)) : [seq, ...s.rotinas],
          };
        }),
      removerRotina: (id) => set((s) => ({ rotinas: s.rotinas.filter((r) => r.id !== id) })),
      editarRotina: (id) => {
        const rotina = get().rotinas.find((r) => r.id === id);
        if (rotina) {
          set({ rascunho: { ...rotina, itens: rotina.itens.map((i) => ({ ...i })) }, rascunhoInfo: null });
        }
      },

      addAvaliacao: (entry) => set((s) => ({ avaliacoes: [...s.avaliacoes, entry] })),
      removerAvaliacao: (id) => set((s) => ({ avaliacoes: s.avaliacoes.filter((a) => a.id !== id) })),

      registrarSessao: (sessao) => set((s) => ({ historico: [sessao, ...s.historico].slice(0, 200) })),
      toggleFavorito: (id) =>
        set((s) => ({
          favoritos: s.favoritos.includes(id) ? s.favoritos.filter((f) => f !== id) : [...s.favoritos, id],
        })),

      setValidacaoAtiva: (validacaoAtiva) => {
        set({ validacaoAtiva });
        if (validacaoAtiva) get().track('sessao_inicio');
      },
      track: (tipo, dados) => {
        if (!get().validacaoAtiva) return;
        const event: MetricEvent = { t: Date.now(), tipo, sessao: SESSION_ID, dados };
        set((s) => ({ eventos: [...s.eventos, event].slice(-MAX_EVENTOS) }));
      },
      addResposta: (resposta) => set((s) => ({ respostas: [...s.respostas, resposta] })),
      limparMetricas: () => set({ eventos: [], respostas: [] }),
      resetTudo: () => set({ ...INITIAL }),
    }),
    {
      name: 'mobiliapp-v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s): PersistedState => ({
        onboarded: s.onboarded,
        kit: s.kit,
        nivel: s.nivel,
        modoPro: s.modoPro,
        nomeProfissional: s.nomeProfissional,
        rotinas: s.rotinas,
        rascunho: s.rascunho,
        rascunhoInfo: s.rascunhoInfo,
        avaliacoes: s.avaliacoes,
        historico: s.historico,
        favoritos: s.favoritos,
        validacaoAtiva: s.validacaoAtiva,
        eventos: s.eventos,
        respostas: s.respostas,
      }),
      onRehydrateStorage: () => (state) => {
        useAppStore.setState({ hydrated: true });
        if (state?.validacaoAtiva) state.track('sessao_inicio');
      },
    },
  ),
);

/** Cria uma rotina vazia ou a partir de itens, já com metadados. */
export function makeSequence(partial: Partial<Sequence> & { nome: string; itens: SequenceItem[] }): Sequence {
  const now = new Date().toISOString();
  return {
    id: newId('r'),
    criadaEm: now,
    atualizadaEm: now,
    origem: 'manual',
    ...partial,
  };
}
