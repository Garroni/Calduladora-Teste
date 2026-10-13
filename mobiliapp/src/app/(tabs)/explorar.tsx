import { useLocalSearchParams } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { ScrollView, Switch, TextInput, View } from 'react-native';

import { BodyMap } from '../../components/BodyMap';
import { ExerciseCard } from '../../components/exercise';
import { PageHeader } from '../../components/layout';
import { Button, Card, Chip, EmptyState, Icon, IconButton, Row, Screen, Txt } from '../../components/ui';
import {
  DIFFICULTY_LABEL,
  EQUIP_CATEGORIES,
  MOVEMENT_TYPES,
  OBJECTIVES,
  OBJECTIVE_BY_ID,
  REGIONS,
  REGION_BY_ID,
} from '../../data/taxonomy';
import type { Difficulty, MovementType, ObjectiveId, RegionId } from '../../data/types';
import { filterExercises, isCompatible, type CatalogFilters, type CategoryFilter } from '../../domain/catalog';
import { useAppStore } from '../../store/useAppStore';
import { radius, spacing, useTheme } from '../../theme';

function ChipRow({ children }: { children: ReactNode }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ marginHorizontal: -spacing.lg }}
      contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: spacing.sm }}
    >
      {children}
    </ScrollView>
  );
}

function FilterLabel({ children }: { children: string }) {
  return (
    <Txt variant="label" tone="muted">
      {children.toUpperCase()}
    </Txt>
  );
}

const hasOwn = (obj: object, key: string) => Object.prototype.hasOwnProperty.call(obj, key);

export default function ExploreScreen() {
  const { c } = useTheme();
  const params = useLocalSearchParams<{ objetivo?: string; regiao?: string; mapa?: string }>();
  const kit = useAppStore((s) => s.kit);
  const track = useAppStore((s) => s.track);

  const [busca, setBusca] = useState('');
  const [regiao, setRegiao] = useState<RegionId | null>(null);
  const [objetivo, setObjetivo] = useState<ObjectiveId | null>(null);
  const [categoria, setCategoria] = useState<CategoryFilter | null>(null);
  const [tipo, setTipo] = useState<MovementType | null>(null);
  const [nivelMax, setNivelMax] = useState<Difficulty | null>(null);
  const [soKit, setSoKit] = useState(true);
  const [soRevisados, setSoRevisados] = useState(false);
  const [mapa, setMapa] = useState(false);
  const [maisFiltros, setMaisFiltros] = useState(false);

  // Filtros vindos da tela inicial: aplicados quando os parâmetros da rota mudam.
  const paramKey = `${params.objetivo ?? ''}|${params.regiao ?? ''}|${params.mapa ?? ''}`;
  const [appliedKey, setAppliedKey] = useState('');
  if (paramKey !== appliedKey) {
    setAppliedKey(paramKey);
    if (params.objetivo && hasOwn(OBJECTIVE_BY_ID, params.objetivo)) {
      setObjetivo(params.objetivo as ObjectiveId);
      setRegiao(null);
    }
    if (params.regiao && hasOwn(REGION_BY_ID, params.regiao)) {
      setRegiao(params.regiao as RegionId);
      setObjetivo(null);
    }
    if (params.mapa) setMapa(true);
  }

  const filters: CatalogFilters = {
    busca,
    regioes: regiao ? [regiao] : undefined,
    objetivos: objetivo ? [objetivo] : undefined,
    categorias: categoria ? [categoria] : undefined,
    tipos: tipo ? [tipo] : undefined,
    dificuldadeMax: nivelMax ?? undefined,
    somenteRevisados: soRevisados,
  };
  const all = filterExercises(filters, kit);
  const results = soKit ? all.filter((ex) => isCompatible(ex, kit)) : all;
  const hidden = all.length - results.length;

  const select = <T,>(name: string, current: T | null, value: T, setter: (v: T | null) => void) => {
    const next = current === value ? null : value;
    setter(next);
    track('filtro', { filtro: name, valor: String(next ?? 'nenhum') });
  };

  const activeCount = [regiao, objetivo, categoria, tipo, nivelMax, busca || null].filter(Boolean).length + (soRevisados ? 1 : 0);
  const clearAll = () => {
    setBusca('');
    setRegiao(null);
    setObjetivo(null);
    setCategoria(null);
    setTipo(null);
    setNivelMax(null);
    setSoRevisados(false);
  };

  return (
    <Screen safeTop>
      <PageHeader title="Explorar" subtitle="Encontre exercícios por região, objetivo, acessório ou nome do músculo." />

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          backgroundColor: c.surface,
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor: c.border,
          paddingHorizontal: spacing.md,
        }}
      >
        <Icon name="magnify" size={20} color={c.textMuted} />
        <TextInput
          value={busca}
          onChangeText={setBusca}
          onEndEditing={() => busca && track('busca', { termo: busca })}
          placeholder="Ex.: panturrilha, glúteo, ombro…"
          placeholderTextColor={c.textMuted}
          returnKeyType="search"
          accessibilityLabel="Buscar exercícios"
          style={{ flex: 1, paddingVertical: 12, fontSize: 15, color: c.text }}
        />
        {busca ? <IconButton icon="close-circle" size={18} color={c.textMuted} label="Limpar busca" onPress={() => setBusca('')} /> : null}
      </View>

      <Card style={{ flexDirection: 'row', alignItems: 'center', padding: spacing.md }}>
        <Icon name="bag-personal-outline" size={20} color={c.primary} />
        <View style={{ flex: 1, marginLeft: spacing.sm }}>
          <Txt variant="bodyStrong">Só com o meu kit</Txt>
          <Txt variant="caption" tone="muted">
            {soKit ? 'Mostrando apenas o que você consegue fazer agora.' : 'Mostrando tudo, com alternativas para o que falta.'}
          </Txt>
        </View>
        <Switch
          value={soKit}
          onValueChange={(v) => {
            setSoKit(v);
            track('filtro', { filtro: 'kit', valor: v });
          }}
          trackColor={{ true: c.primary, false: c.border }}
          accessibilityLabel="Mostrar só exercícios compatíveis com o meu kit"
        />
      </Card>

      <View style={{ gap: spacing.sm }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <FilterLabel>Região</FilterLabel>
          <Chip
            small
            icon="human"
            label={mapa ? 'Ocultar mapa' : 'Mapa corporal'}
            selected={mapa}
            onPress={() => {
              setMapa(!mapa);
              if (!mapa) track('filtro', { filtro: 'mapa', valor: true });
            }}
          />
        </Row>
        {mapa ? (
          <Card>
            <BodyMap
              value={regiao}
              onChange={(r) => {
                setRegiao(r);
                track('filtro', { filtro: 'regiao', valor: String(r ?? 'nenhum') });
              }}
              height={260}
            />
          </Card>
        ) : (
          <ChipRow>
            {REGIONS.map((r) => (
              <Chip key={r.id} label={r.curto} selected={regiao === r.id} onPress={() => select('regiao', regiao, r.id, setRegiao)} />
            ))}
          </ChipRow>
        )}
      </View>

      <View style={{ gap: spacing.sm }}>
        <FilterLabel>Objetivo</FilterLabel>
        <ChipRow>
          {OBJECTIVES.map((o) => (
            <Chip
              key={o.id}
              icon={o.icone}
              label={o.nome}
              selected={objetivo === o.id}
              onPress={() => select('objetivo', objetivo, o.id, setObjetivo)}
            />
          ))}
        </ChipRow>
      </View>

      <View style={{ gap: spacing.sm }}>
        <FilterLabel>Acessório</FilterLabel>
        <ChipRow>
          {EQUIP_CATEGORIES.map((cat) => (
            <Chip
              key={cat.id}
              label={cat.nome}
              selected={categoria === cat.id}
              onPress={() => select('categoria', categoria, cat.id as CategoryFilter, setCategoria)}
            />
          ))}
          <Chip
            label="Sem acessórios"
            selected={categoria === 'sem'}
            onPress={() => select('categoria', categoria, 'sem' as CategoryFilter, setCategoria)}
          />
        </ChipRow>
      </View>

      {maisFiltros ? (
        <>
          <View style={{ gap: spacing.sm }}>
            <FilterLabel>Tipo de movimento</FilterLabel>
            <ChipRow>
              {MOVEMENT_TYPES.map((m) => (
                <Chip key={m.id} label={m.nome} selected={tipo === m.id} onPress={() => select('tipo', tipo, m.id, setTipo)} />
              ))}
            </ChipRow>
          </View>
          <View style={{ gap: spacing.sm }}>
            <FilterLabel>Nível máximo</FilterLabel>
            <Row wrap>
              {([1, 2, 3] as Difficulty[]).map((d) => (
                <Chip key={d} label={DIFFICULTY_LABEL[d]} selected={nivelMax === d} onPress={() => select('nivel', nivelMax, d, setNivelMax)} />
              ))}
            </Row>
          </View>
          <Row wrap>
            <Chip
              icon="check-decagram"
              label="Somente revisados por profissional"
              selected={soRevisados}
              onPress={() => {
                setSoRevisados(!soRevisados);
                track('filtro', { filtro: 'revisados', valor: !soRevisados });
              }}
            />
          </Row>
        </>
      ) : null}

      <Row style={{ justifyContent: 'space-between' }}>
        <Chip
          small
          icon={maisFiltros ? 'chevron-up' : 'tune-variant'}
          label={maisFiltros ? 'Menos filtros' : 'Mais filtros'}
          onPress={() => setMaisFiltros(!maisFiltros)}
        />
        {activeCount > 0 ? <Chip small icon="close" label={`Limpar (${activeCount})`} onPress={clearAll} /> : null}
      </Row>

      <Txt variant="label" tone="muted">
        {results.length} {results.length === 1 ? 'EXERCÍCIO' : 'EXERCÍCIOS'}
      </Txt>

      <View style={{ gap: spacing.sm }}>
        {results.map((ex) => (
          <ExerciseCard key={ex.id} exercise={ex} kit={kit} />
        ))}
      </View>

      {results.length === 0 ? (
        <EmptyState
          icon="magnify-close"
          title="Nada encontrado com esses filtros"
          text={
            soRevisados
              ? 'Os exercícios do protótipo ainda aguardam revisão técnica. Desmarque o filtro de revisados para vê-los.'
              : hidden > 0
                ? 'Existem opções que pedem acessórios que você não marcou.'
                : 'Tente remover algum filtro ou buscar outro termo.'
          }
        />
      ) : null}

      {soKit && hidden > 0 ? (
        <Card style={{ alignItems: 'center', gap: spacing.sm }}>
          <Txt tone="muted" style={{ textAlign: 'center' }}>
            Mais {hidden} {hidden === 1 ? 'exercício precisa' : 'exercícios precisam'} de acessórios que você não marcou.
          </Txt>
          <Button small variant="secondary" icon="swap-horizontal" label="Ver com alternativas" onPress={() => setSoKit(false)} />
        </Card>
      ) : null}
    </Screen>
  );
}
