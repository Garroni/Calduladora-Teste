import { router } from 'expo-router';
import { View } from 'react-native';

import { PageHeader } from '../../components/layout';
import { Badge, Card, EmptyState, Icon, IconButton, Row, Screen, Section, Txt } from '../../components/ui';
import { EXERCISE_BY_ID } from '../../data/exercises';
import { isCompatible } from '../../domain/catalog';
import { sequenceSeconds } from '../../domain/sequence';
import { formatDate, formatDuration } from '../../domain/text';
import { useAppStore } from '../../store/useAppStore';
import { radius, spacing, useTheme } from '../../theme';

export default function RoutinesScreen() {
  const { c } = useTheme();
  const rotinas = useAppStore((s) => s.rotinas);
  const historico = useAppStore((s) => s.historico);
  const modoPro = useAppStore((s) => s.modoPro);
  const kit = useAppStore((s) => s.kit);

  const modelos = rotinas.filter((r) => r.modelo);
  const outras = rotinas.filter((r) => !r.modelo);

  const renderRoutine = (r: (typeof rotinas)[number]) => {
    const incompativeis = r.itens.filter((i) => {
      const ex = EXERCISE_BY_ID[i.exerciseId];
      return ex && !isCompatible(ex, kit);
    }).length;
    return (
      <Card key={r.id} onPress={() => router.push(`/rotinas/${r.id}`)}>
        <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ flex: 1, gap: 4 }}>
            <Txt variant="bodyStrong" numberOfLines={2}>
              {r.nome}
            </Txt>
            <Txt variant="caption" tone="muted">
              {r.itens.length} exercícios · {formatDuration(sequenceSeconds(r.itens))}
              {r.autor ? ` · por ${r.autor}` : ''}
            </Txt>
          </View>
          <Icon name="chevron-right" size={22} color={c.textMuted} />
        </Row>
        <Row wrap gap={6}>
          {r.modelo ? <Badge tone="primary" icon="file-document-outline" label="Modelo" /> : null}
          {r.origem === 'importada' ? <Badge icon="download" label="Recebida" /> : null}
          {incompativeis > 0 ? <Badge tone="accent" icon="swap-horizontal" label={`${incompativeis} para adaptar`} /> : null}
        </Row>
      </Card>
    );
  };

  return (
    <Screen safeTop>
      <PageHeader
        title="Rotinas"
        subtitle={modoPro ? 'Seus modelos e rotinas para alunos.' : 'Sequências salvas e recebidas.'}
        right={<IconButton icon="qrcode-scan" label="Abrir rotina recebida" onPress={() => router.push('/importar')} />}
      />

      {modoPro ? (
        <View style={{ flexDirection: 'row', gap: spacing.md, padding: spacing.md, borderRadius: radius.md, backgroundColor: c.primarySoft }}>
          <Icon name="account-tie" size={22} color={c.primary} />
          <Txt variant="caption" style={{ flex: 1, color: c.primarySoftText }}>
            Modo profissional ativo: monte modelos, adicione observações e envie para o aluno por link ou QR code. Ele abre no celular e acompanha com cronômetro.
          </Txt>
        </View>
      ) : null}

      {rotinas.length === 0 ? (
        <EmptyState
          icon="bookmark-outline"
          title="Nenhuma rotina salva"
          text="Monte uma sequência e salve para repetir quando quiser. Rotinas recebidas por link também aparecem aqui."
          action={{ label: 'Montar sequência', icon: 'playlist-plus', onPress: () => router.push('/montar') }}
        />
      ) : null}

      {modelos.length > 0 ? <Section title="Modelos">{modelos.map(renderRoutine)}</Section> : null}
      {outras.length > 0 ? <Section title={modelos.length ? 'Outras rotinas' : 'Minhas rotinas'}>{outras.map(renderRoutine)}</Section> : null}

      {historico.length > 0 ? (
        <Section title="Concluídas recentemente">
          <Card style={{ gap: spacing.md }}>
            {historico.slice(0, 5).map((h) => (
              <Row key={h.id} style={{ justifyContent: 'space-between' }}>
                <Row style={{ flex: 1 }}>
                  <Icon name="check-circle" size={18} color={c.success} />
                  <Txt numberOfLines={1} style={{ flex: 1 }}>
                    {h.nome}
                  </Txt>
                </Row>
                <Txt variant="caption" tone="muted">
                  {formatDate(h.data)}
                </Txt>
              </Row>
            ))}
          </Card>
        </Section>
      ) : null}
    </Screen>
  );
}
