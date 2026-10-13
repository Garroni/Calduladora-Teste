import * as Haptics from 'expo-haptics';
import { useKeepAwake } from 'expo-keep-awake';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MOVEMENT_ICON } from '../components/exercise';
import { ProgressRing } from '../components/layout';
import { Button, EmptyState, Icon, IconButton, Row, Txt } from '../components/ui';
import { EXERCISE_BY_ID } from '../data/exercises';
import { buildSteps, sequenceSeconds, type PlayerStep } from '../domain/sequence';
import { formatClock, formatDuration, newId } from '../domain/text';
import { useAppStore } from '../store/useAppStore';
import { radius, spacing, useTheme } from '../theme';

function stepTitle(step: PlayerStep): string {
  switch (step.kind) {
    case 'preparo':
      return 'Prepare-se';
    case 'transicao':
      return 'Próximo exercício';
    case 'troca_lado':
      return 'Troque de lado';
    case 'trabalho':
      return step.lado === 'direito' ? 'Lado direito' : step.lado === 'esquerdo' ? 'Lado esquerdo' : 'Em execução';
  }
}

function haptic(kind: 'step' | 'done') {
  if (Platform.OS === 'web') return;
  if (kind === 'done') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  else Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
}

export default function PlayerScreen() {
  useKeepAwake();
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const rascunho = useAppStore((s) => s.rascunho);
  const rotinas = useAppStore((s) => s.rotinas);
  const registrarSessao = useAppStore((s) => s.registrarSessao);
  const salvarRotina = useAppStore((s) => s.salvarRotina);
  const track = useAppStore((s) => s.track);

  const sequence = id === 'rascunho' ? rascunho : rotinas.find((r) => r.id === id) ?? null;
  // Congela a sequência no início, para que edições não alterem a sessão em andamento.
  const [seq] = useState(sequence);
  const steps = useMemo(() => (seq ? buildSteps(seq.itens) : []), [seq]);

  const [index, setIndex] = useState(0);
  const [remainingMs, setRemainingMs] = useState(() => (steps[0]?.seg ?? 0) * 1000);
  const [running, setRunning] = useState(true);
  const [done, setDone] = useState(false);
  const [saved, setSaved] = useState(false);
  const endAt = useRef(0);
  const startedAt = useRef(0);

  useEffect(() => {
    startedAt.current = Date.now();
    if (seq) track('sequencia_iniciada', { itens: seq.itens.length, origem: seq.origem });
  }, [seq, track]);

  const goTo = useCallback(
    (next: number) => {
      if (next >= steps.length) {
        setDone(true);
        setRunning(false);
        haptic('done');
        if (seq) {
          registrarSessao({
            id: newId('h'),
            nome: seq.nome,
            data: new Date().toISOString(),
            duracaoSeg: Math.round((Date.now() - startedAt.current) / 1000),
            exercicios: seq.itens.length,
          });
          track('sequencia_concluida', { itens: seq.itens.length });
        }
        return;
      }
      const target = Math.max(0, next);
      const ms = steps[target].seg * 1000;
      setIndex(target);
      setRemainingMs(ms);
      endAt.current = Date.now() + ms;
      haptic('step');
    },
    [steps, seq, registrarSessao, track],
  );

  useEffect(() => {
    if (!running || done) return;
    endAt.current = Date.now() + remainingMs;
    const timer = setInterval(() => {
      const left = endAt.current - Date.now();
      if (left <= 0) {
        clearInterval(timer);
        goTo(index + 1);
      } else {
        setRemainingMs(left);
      }
    }, 200);
    return () => clearInterval(timer);
    // remainingMs entra só como ponto de partida ao (re)começar o passo.
  }, [running, index, done, goTo]); // eslint-disable-line react-hooks/exhaustive-deps

  const close = () => {
    if (done) {
      router.back();
      return;
    }
    const leave = () => router.back();
    if (Platform.OS === 'web') {
      leave();
      return;
    }
    Alert.alert('Encerrar sequência?', 'Seu progresso nesta sessão não será registrado.', [
      { text: 'Continuar', style: 'cancel' },
      { text: 'Encerrar', style: 'destructive', onPress: leave },
    ]);
  };

  if (!seq || steps.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: c.bg, paddingTop: insets.top, justifyContent: 'center' }}>
        <EmptyState icon="playlist-remove" title="Sequência não encontrada" action={{ label: 'Voltar', onPress: () => router.back() }} />
      </View>
    );
  }

  const totalSeg = steps.reduce((s, st) => s + st.seg, 0);
  const elapsedSeg = steps.slice(0, index).reduce((s, st) => s + st.seg, 0) + (steps[index]?.seg ?? 0) - remainingMs / 1000;

  if (done) {
    const isDraft = id === 'rascunho';
    return (
      <View style={{ flex: 1, backgroundColor: c.bg, paddingTop: insets.top + spacing.xl, paddingHorizontal: spacing.lg, gap: spacing.lg }}>
        <View style={{ alignItems: 'center', gap: spacing.md, marginTop: spacing.xxl }}>
          <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: c.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="party-popper" size={48} color={c.primary} />
          </View>
          <Txt variant="title" style={{ textAlign: 'center' }}>
            Sequência concluída!
          </Txt>
          <Txt tone="muted" style={{ textAlign: 'center' }}>
            {seq.nome}
            {'\n'}
            {seq.itens.length} exercícios · {formatDuration(sequenceSeconds(seq.itens))}
          </Txt>
        </View>
        <View style={{ gap: spacing.sm, marginTop: spacing.xl }}>
          {isDraft && !saved && !rotinas.some((r) => r.id === seq.id) ? (
            <Button
              variant="secondary"
              icon="content-save-outline"
              label="Salvar esta sequência"
              onPress={() => {
                salvarRotina({ ...seq, atualizadaEm: new Date().toISOString() });
                track('rotina_salva', { itens: seq.itens.length, origem: 'player' });
                setSaved(true);
              }}
            />
          ) : null}
          {saved ? (
            <Txt tone="success" style={{ textAlign: 'center' }}>
              Salva em Rotinas.
            </Txt>
          ) : null}
          <Button icon="check" label="Concluir" onPress={() => router.back()} />
        </View>
      </View>
    );
  }

  const step = steps[index];
  const item = seq.itens[step.itemIndex];
  const ex = EXERCISE_BY_ID[item.exerciseId];
  const isWork = step.kind === 'trabalho';
  const ringColor = isWork ? c.primary : c.accent;
  const stepProgress = 1 - remainingMs / (step.seg * 1000);

  return (
    <View style={{ flex: 1, backgroundColor: c.bg, paddingTop: insets.top, paddingBottom: insets.bottom + spacing.md }}>
      <Row style={{ paddingHorizontal: spacing.sm, justifyContent: 'space-between' }}>
        <IconButton icon="close" label="Encerrar sequência" onPress={close} />
        <Txt variant="caption" tone="muted">
          Exercício {step.itemIndex + 1} de {seq.itens.length} · {formatClock(totalSeg - elapsedSeg)} restantes
        </Txt>
        <View style={{ width: 40 }} />
      </Row>
      <View style={{ height: 4, marginHorizontal: spacing.lg, borderRadius: 2, backgroundColor: c.surfaceAlt, overflow: 'hidden' }}>
        <View style={{ width: `${Math.min(100, (elapsedSeg / totalSeg) * 100)}%`, height: 4, backgroundColor: c.primary }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg, alignItems: 'center' }}>
        <Txt variant="label" style={{ color: ringColor }}>
          {stepTitle(step).toUpperCase()}
        </Txt>
        <Txt variant="title" style={{ textAlign: 'center' }} accessibilityLiveRegion="polite">
          {ex.nome}
        </Txt>

        <ProgressRing size={220} stroke={14} progress={stepProgress} color={ringColor} track={c.surfaceAlt}>
          <Icon name={MOVEMENT_ICON[ex.tipo]} size={28} color={ringColor} />
          <Txt style={{ fontSize: 56, lineHeight: 64, fontWeight: '800', color: c.text, fontVariant: ['tabular-nums'] }}>
            {formatClock(remainingMs / 1000)}
          </Txt>
          <Txt variant="caption" tone="muted">
            {ex.dosagem}
          </Txt>
        </ProgressRing>

        <View style={{ alignSelf: 'stretch', backgroundColor: c.surface, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.sm, borderWidth: 1, borderColor: c.border }}>
          {step.kind === 'troca_lado' ? (
            <Txt>Volte à posição inicial e prepare o outro lado.</Txt>
          ) : (
            ex.instrucoes.map((line, i) => (
              <Row key={i} style={{ alignItems: 'flex-start' }}>
                <Txt variant="bodyStrong" tone="primary" style={{ width: 18 }}>
                  {i + 1}
                </Txt>
                <Txt style={{ flex: 1 }}>{line}</Txt>
              </Row>
            ))
          )}
        </View>

        {isWork && seq.itens[step.itemIndex + 1] && step.lado !== 'direito' ? (
          <Txt variant="caption" tone="muted">
            A seguir: {EXERCISE_BY_ID[seq.itens[step.itemIndex + 1].exerciseId].nome}
          </Txt>
        ) : null}
      </ScrollView>

      <Row style={{ justifyContent: 'center', gap: spacing.xl, paddingTop: spacing.sm }}>
        <IconButton icon="skip-previous" label="Voltar" size={30} onPress={() => goTo(index - 1)} disabled={index === 0} />
        <Pressable
          onPress={() => setRunning(!running)}
          accessibilityRole="button"
          accessibilityLabel={running ? 'Pausar' : 'Continuar'}
          style={({ pressed }) => ({
            width: 76,
            height: 76,
            borderRadius: 38,
            backgroundColor: c.primary,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <Icon name={running ? 'pause' : 'play'} size={38} color={c.primaryText} />
        </Pressable>
        <IconButton icon="skip-next" label="Avançar" size={30} onPress={() => goTo(index + 1)} />
      </Row>
    </View>
  );
}
