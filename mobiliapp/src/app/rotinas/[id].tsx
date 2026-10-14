import { router, useLocalSearchParams } from 'expo-router';
import { Alert, Platform, View } from 'react-native';

import { SequenceItemRow } from '../../components/sequence';
import { Badge, Button, Card, EmptyState, Icon, Row, Screen, Txt } from '../../components/ui';
import { EXERCISE_BY_ID } from '../../data/exercises';
import { OBJECTIVE_BY_ID, REGION_BY_ID } from '../../data/taxonomy';
import { isCompatible } from '../../domain/catalog';
import { adaptToKit, sequenceSeconds } from '../../domain/sequence';
import { formatDate, formatDuration } from '../../domain/text';
import { makeSequence, useAppStore } from '../../store/useAppStore';
import { radius, spacing, useTheme } from '../../theme';

export default function RoutineDetailScreen() {
  const { c } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const rotina = useAppStore((s) => s.rotinas.find((r) => r.id === id));
  const kit = useAppStore((s) => s.kit);
  const nivel = useAppStore((s) => s.nivel);
  const editarRotina = useAppStore((s) => s.editarRotina);
  const removerRotina = useAppStore((s) => s.removerRotina);
  const setRascunho = useAppStore((s) => s.setRascunho);

  if (!rotina) {
    return (
      <Screen>
        <EmptyState icon="bookmark-remove-outline" title="Rotina não encontrada" action={{ label: 'Voltar', onPress: () => router.back() }} />
      </Screen>
    );
  }

  const incompativeis = rotina.itens.filter((i) => {
    const ex = EXERCISE_BY_ID[i.exerciseId];
    return ex && !isCompatible(ex, kit);
  });

  const adaptar = () => {
    const result = adaptToKit(rotina.itens, kit, nivel);
    const avisos = [
      ...result.trocas.map((t) => `Trocamos "${EXERCISE_BY_ID[t.de].nome}" por "${EXERCISE_BY_ID[t.para].nome}", que usa o que você tem.`),
      ...result.semAlternativa.map((exId) => `${EXERCISE_BY_ID[exId].nome}: sem substituto equivalente no seu kit.`),
    ];
    setRascunho(
      makeSequence({
        nome: `${rotina.nome} (adaptada)`,
        itens: result.itens,
        origem: 'manual',
        objetivo: rotina.objetivo,
        regiao: rotina.regiao,
        notas: rotina.notas,
        autor: rotina.autor,
      }),
      { avisos },
    );
    router.push('/sequencia');
  };

  const excluir = () => {
    const doDelete = () => {
      removerRotina(rotina.id);
      router.back();
    };
    if (Platform.OS === 'web') {
      doDelete();
      return;
    }
    Alert.alert('Excluir rotina?', rotina.nome, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: doDelete },
    ]);
  };

  return (
    <Screen>
      <View style={{ gap: spacing.sm }}>
        <Txt variant="title">{rotina.nome}</Txt>
        <Row wrap gap={6}>
          <Badge tone="primary" icon="timer-outline" label={formatDuration(sequenceSeconds(rotina.itens))} />
          <Badge label={`${rotina.itens.length} exercícios`} />
          {rotina.objetivo ? <Badge label={OBJECTIVE_BY_ID[rotina.objetivo].nome} /> : null}
          {rotina.regiao ? <Badge label={REGION_BY_ID[rotina.regiao].curto} /> : null}
          {rotina.modelo ? <Badge tone="primary" icon="file-document-outline" label="Modelo" /> : null}
        </Row>
        <Txt variant="caption" tone="muted">
          {rotina.autor ? `Por ${rotina.autor} · ` : ''}Atualizada em {formatDate(rotina.atualizadaEm)}
        </Txt>
      </View>

      {rotina.notas ? (
        <Card>
          <Row gap={6}>
            <Icon name="message-text-outline" size={18} color={c.primary} />
            <Txt variant="label" tone="muted">
              OBSERVAÇÕES{rotina.autor ? ` DE ${rotina.autor.toUpperCase()}` : ''}
            </Txt>
          </Row>
          <Txt>{rotina.notas}</Txt>
        </Card>
      ) : null}

      {incompativeis.length > 0 ? (
        <View style={{ padding: spacing.lg, borderRadius: radius.lg, backgroundColor: c.accentSoft, gap: spacing.sm }}>
          <Row>
            <Icon name="swap-horizontal" size={22} color={c.accent} />
            <Txt variant="bodyStrong" style={{ flex: 1 }}>
              {incompativeis.length === 1 ? '1 exercício usa' : `${incompativeis.length} exercícios usam`} acessórios que você não marcou.
            </Txt>
          </Row>
          <Txt variant="caption">O app troca por exercícios equivalentes, de mesma finalidade, que usam o que você tem.</Txt>
          <Button small variant="accent" icon="auto-fix" label="Adaptar ao meu kit" onPress={adaptar} />
        </View>
      ) : null}

      <View style={{ gap: spacing.sm }}>
        {rotina.itens.map((item, i) => (
          <SequenceItemRow key={`${item.exerciseId}-${i}`} index={i} item={item} kit={kit} />
        ))}
      </View>

      <View style={{ gap: spacing.sm }}>
        <Button icon="play" label="Iniciar" onPress={() => router.push({ pathname: '/player', params: { id: rotina.id } })} />
        <Row>
          <Button
            variant="secondary"
            icon="pencil"
            label="Editar"
            style={{ flex: 1 }}
            onPress={() => {
              editarRotina(rotina.id);
              router.push('/sequencia');
            }}
          />
          <Button
            variant="secondary"
            icon="qrcode"
            label="Compartilhar"
            style={{ flex: 1 }}
            onPress={() => router.push(`/compartilhar/${rotina.id}`)}
          />
        </Row>
        <Button variant="danger" icon="delete-outline" label="Excluir rotina" onPress={excluir} />
      </View>
    </Screen>
  );
}
