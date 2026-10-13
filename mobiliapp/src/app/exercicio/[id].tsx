import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';

import { DemoPlaceholder, ExerciseCard, ReviewBadge } from '../../components/exercise';
import { InfoTile, NumberedSteps, SafetyNote } from '../../components/layout';
import { Badge, Bullets, Button, Card, EmptyState, Icon, IconButton, Row, Screen, Section, Txt } from '../../components/ui';
import { EXERCISE_BY_ID } from '../../data/exercises';
import {
  DIFFICULTY_LABEL,
  EQUIPMENT_BY_ID,
  MOVEMENT_TYPE_BY_ID,
  OBJECTIVE_BY_ID,
  REGION_BY_ID,
  REVIEW_LABEL,
} from '../../data/taxonomy';
import { describeMissing, describeRequirement, findAlternatives, isCompatible } from '../../domain/catalog';
import { clampWork } from '../../domain/sequence';
import { makeSequence, useAppStore } from '../../store/useAppStore';
import { radius, spacing, useTheme } from '../../theme';

export default function ExerciseDetailScreen() {
  const { c } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const kit = useAppStore((s) => s.kit);
  const nivel = useAppStore((s) => s.nivel);
  const favoritos = useAppStore((s) => s.favoritos);
  const toggleFavorito = useAppStore((s) => s.toggleFavorito);
  const rascunho = useAppStore((s) => s.rascunho);
  const setRascunho = useAppStore((s) => s.setRascunho);
  const setRascunhoItens = useAppStore((s) => s.setRascunhoItens);
  const track = useAppStore((s) => s.track);

  const ex = id && Object.prototype.hasOwnProperty.call(EXERCISE_BY_ID, id) ? EXERCISE_BY_ID[id] : undefined;
  const compatible = ex ? isCompatible(ex, kit) : false;

  const exId = ex?.id;
  useEffect(() => {
    // Registra a abertura do exercício (uma vez por exercício aberto).
    if (exId) track('exercicio_visto', { id: exId, compativel: compatible });
  }, [exId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!ex) {
    return (
      <Screen>
        <EmptyState icon="help-circle-outline" title="Exercício não encontrado" action={{ label: 'Voltar', onPress: () => router.back() }} />
      </Screen>
    );
  }

  const missing = describeMissing(ex, kit);
  const { equivalentes, relacionados } = findAlternatives(ex, kit);
  const favorito = favoritos.includes(ex.id);
  const review = REVIEW_LABEL[ex.revisao.status];
  const inDraft = rascunho?.itens.some((i) => i.exerciseId === ex.id);

  const addToSequence = () => {
    const item = { exerciseId: ex.id, trabalhoSeg: clampWork(ex.duracaoSeg) };
    if (rascunho) setRascunhoItens([...rascunho.itens, item]);
    else setRascunho(makeSequence({ nome: 'Nova rotina', itens: [item], origem: 'manual' }));
    router.push('/sequencia');
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: '',
          headerRight: () => (
            <IconButton
              icon={favorito ? 'heart' : 'heart-outline'}
              color={favorito ? c.accent : c.text}
              label={favorito ? 'Remover dos favoritos' : 'Favoritar'}
              onPress={() => toggleFavorito(ex.id)}
            />
          ),
        }}
      />
      <Screen>
        <DemoPlaceholder exercise={ex} />

        <View style={{ gap: spacing.sm }}>
          <Txt variant="title" accessibilityRole="header">
            {ex.nome}
          </Txt>
          {ex.outrosNomes?.length ? (
            <Txt variant="caption" tone="muted">
              Também conhecido como: {ex.outrosNomes.join(', ')}
            </Txt>
          ) : null}
          <ReviewBadge status={ex.revisao.status} />
          <Txt variant="caption" tone="muted">
            {review.descricao}
            {ex.revisao.revisor ? ` Revisor: ${ex.revisao.revisor}${ex.revisao.registroProfissional ? ` (${ex.revisao.registroProfissional})` : ''}.` : ''}
          </Txt>
        </View>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          <InfoTile icon="shape-outline" label="Tipo" value={MOVEMENT_TYPE_BY_ID[ex.tipo].nome} />
          <InfoTile icon="signal-cellular-2" label="Nível" value={DIFFICULTY_LABEL[ex.dificuldade]} />
          <InfoTile icon="timer-outline" label="Dosagem" value={ex.dosagem} />
          <InfoTile icon="human" label="Região" value={ex.regioes.map((r) => REGION_BY_ID[r].curto).join(', ')} />
        </View>

        <Section title="Objetivos">
          <Row wrap gap={6}>
            {ex.objetivos.map((o) => (
              <Badge key={o} tone="primary" icon={OBJECTIVE_BY_ID[o].icone} label={OBJECTIVE_BY_ID[o].nome} />
            ))}
          </Row>
        </Section>

        <Section title="Equipamentos">
          <Card style={{ gap: spacing.md }}>
            {ex.requisitos.length === 0 ? (
              <Row>
                <Icon name="check-circle" size={20} color={c.success} />
                <Txt>Não precisa de acessórios</Txt>
              </Row>
            ) : (
              ex.requisitos.map((slot, i) => {
                const ok = slot.some((e) => kit.includes(e));
                return (
                  <Row key={i} style={{ alignItems: 'flex-start' }}>
                    <Icon name={ok ? 'check-circle' : 'close-circle-outline'} size={20} color={ok ? c.success : c.accent} />
                    <View style={{ flex: 1 }}>
                      <Txt variant="bodyStrong">{describeRequirement(slot)}</Txt>
                      <Txt variant="caption" tone="muted">
                        {ok ? 'Você tem' : 'Não está no seu kit'}
                      </Txt>
                    </View>
                  </Row>
                );
              })
            )}
            {ex.opcionais?.length ? (
              <Txt variant="caption" tone="muted">
                Opcional: {ex.opcionais.map((e) => EQUIPMENT_BY_ID[e].nome).join(', ')}
              </Txt>
            ) : null}
          </Card>
        </Section>

        {!compatible ? (
          <View style={{ padding: spacing.lg, borderRadius: radius.lg, backgroundColor: c.accentSoft, gap: spacing.sm }}>
            <Row>
              <Icon name="swap-horizontal" size={22} color={c.accent} />
              <Txt variant="heading" style={{ flex: 1 }}>
                Sem {missing?.toLowerCase()}?
              </Txt>
            </Row>
            <Txt variant="caption">
              {equivalentes.length > 0
                ? 'Estes exercícios têm a mesma finalidade e usam o que você tem:'
                : 'Não há substituto da mesma finalidade com o seu kit atual.'}
            </Txt>
          </View>
        ) : null}

        {equivalentes.length > 0 ? (
          <Section
            title={compatible ? 'Variações equivalentes' : 'Substitutos com o seu kit'}
            subtitle="Mesma finalidade e padrão de movimento."
          >
            {equivalentes.slice(0, 4).map((alt) => (
              <ExerciseCard
                key={alt.id}
                exercise={alt}
                kit={kit}
                onPress={() => {
                  track('alternativa_vista', { de: ex.id, para: alt.id, origem: 'exercicio' });
                  router.push(`/exercicio/${alt.id}`);
                }}
              />
            ))}
          </Section>
        ) : null}

        {!compatible && relacionados.length > 0 ? (
          <Section title="Outras opções para a mesma região" subtitle="Não são substitutos diretos: a finalidade é diferente.">
            {relacionados.map((alt) => (
              <ExerciseCard key={alt.id} exercise={alt} kit={kit} />
            ))}
          </Section>
        ) : null}

        <Section title="Como fazer">
          <NumberedSteps steps={ex.instrucoes} />
          {ex.dicas?.length ? (
            <View style={{ padding: spacing.md, borderRadius: radius.md, backgroundColor: c.primarySoft, gap: 4 }}>
              <Row gap={6}>
                <Icon name="lightbulb-on-outline" size={18} color={c.primary} />
                <Txt variant="bodyStrong" style={{ color: c.primarySoftText }}>
                  Dica
                </Txt>
              </Row>
              {ex.dicas.map((d, i) => (
                <Txt key={i} style={{ color: c.primarySoftText }}>
                  {d}
                </Txt>
              ))}
            </View>
          ) : null}
        </Section>

        <Section title="Adaptações">
          <Bullets items={ex.adaptacoes} icon="tune-variant" />
        </Section>

        <Section title="Cuidados e limitações">
          <Bullets items={ex.limitacoes} icon="alert-outline" tone="warning" />
        </Section>

        <Section title="Músculos e estruturas envolvidas">
          <Txt tone="muted">{ex.musculos.join(' · ')}</Txt>
        </Section>

        {nivel < ex.dificuldade ? (
          <Txt variant="caption" tone="muted">
            Este exercício está acima do nível marcado no seu perfil ({DIFFICULTY_LABEL[nivel].toLowerCase()}).
          </Txt>
        ) : null}

        <Button
          icon={inDraft ? 'playlist-check' : 'playlist-plus'}
          variant="secondary"
          label={inDraft ? 'Já está na sequência · abrir' : rascunho ? 'Adicionar à sequência em edição' : 'Começar uma sequência com este'}
          onPress={inDraft ? () => router.push('/sequencia') : addToSequence}
        />

        <SafetyNote />
      </Screen>
    </>
  );
}
