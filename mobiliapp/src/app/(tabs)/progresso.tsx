import { router } from 'expo-router';
import { View } from 'react-native';

import { PageHeader } from '../../components/layout';
import { Card, Icon, Row, Screen, Section, Txt } from '../../components/ui';
import { ASSESSMENTS } from '../../data/assessments';
import { REGION_BY_ID } from '../../data/taxonomy';
import { entryValue, formatValue, summarize } from '../../domain/assessment';
import { formatDate, formatDuration } from '../../domain/text';
import { useAppStore } from '../../store/useAppStore';
import { radius, spacing, useTheme } from '../../theme';

function startOfWeek(d: Date) {
  const copy = new Date(d);
  const day = (copy.getDay() + 6) % 7;
  copy.setHours(0, 0, 0, 0);
  copy.setDate(copy.getDate() - day);
  return copy;
}

export default function ProgressScreen() {
  const { c } = useTheme();
  const avaliacoes = useAppStore((s) => s.avaliacoes);
  const historico = useAppStore((s) => s.historico);

  const weekStart = startOfWeek(new Date()).getTime();
  const thisWeek = historico.filter((h) => new Date(h.data).getTime() >= weekStart);
  const totalSeg = historico.reduce((s, h) => s + h.duracaoSeg, 0);

  return (
    <Screen safeTop>
      <PageHeader title="Progresso" subtitle="Avaliações simples e padronizadas para acompanhar sua mobilidade ao longo do tempo." />

      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        {[
          { label: 'Nesta semana', value: String(thisWeek.length), icon: 'calendar-check' },
          { label: 'Sessões', value: String(historico.length), icon: 'check-all' },
          { label: 'Tempo total', value: formatDuration(totalSeg), icon: 'timer-outline' },
        ].map((s) => (
          <View
            key={s.label}
            style={{
              flex: 1,
              padding: spacing.md,
              borderRadius: radius.md,
              backgroundColor: c.surface,
              borderWidth: 1,
              borderColor: c.border,
              gap: 4,
            }}
          >
            <Icon name={s.icon} size={18} color={c.primary} />
            <Txt variant="heading">{s.value}</Txt>
            <Txt variant="caption" tone="muted">
              {s.label}
            </Txt>
          </View>
        ))}
      </View>

      <View style={{ flexDirection: 'row', gap: spacing.sm, padding: spacing.md, borderRadius: radius.md, backgroundColor: c.warningSoft }}>
        <Icon name="information-outline" size={18} color={c.warning} />
        <Txt variant="caption" style={{ flex: 1 }}>
          Estas avaliações servem para acompanhar mudanças, não para diagnosticar lesões. Compare medições feitas em condições
          parecidas (mesmo período do dia, aquecido ou não). Em caso de dor, procure um profissional.
        </Txt>
      </View>

      <Section title="Avaliações">
        {ASSESSMENTS.map((p) => {
          const s = summarize(avaliacoes, p);
          const evol = s.evolucao;
          const trendTone = evol === undefined || Math.abs(evol) < 0.01 ? 'muted' : evol > 0 ? 'success' : 'warning';
          return (
            <Card key={p.id} onPress={() => router.push(`/avaliacao/${p.id}`)}>
              <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={{ flex: 1, gap: 2 }}>
                  <Txt variant="bodyStrong">{p.nome}</Txt>
                  <Txt variant="caption" tone="muted">
                    {REGION_BY_ID[p.regiao].nome} · {p.resumo}
                  </Txt>
                </View>
                <Icon name="chevron-right" size={22} color={c.textMuted} />
              </Row>
              {s.ultimo ? (
                <Row style={{ justifyContent: 'space-between' }}>
                  <Txt>
                    Última: <Txt variant="bodyStrong">{formatValue(Math.round(entryValue(s.ultimo) * 10) / 10, p)}</Txt>
                    <Txt variant="caption" tone="muted">
                      {'  '}
                      {formatDate(s.ultimo.data)}
                    </Txt>
                  </Txt>
                  {evol !== undefined ? (
                    <Txt variant="caption" tone={trendTone} style={{ fontWeight: '700' }}>
                      {Math.abs(evol) < 0.01 ? 'Sem mudança' : `${evol > 0 ? 'Melhorou' : 'Piorou'} ${formatValue(Math.abs(Math.round(evol * 10) / 10), p)}`}
                    </Txt>
                  ) : (
                    <Txt variant="caption" tone="muted">
                      {s.total === 1 ? 'Primeira medição' : 'Sem medição comparável'}
                    </Txt>
                  )}
                </Row>
              ) : (
                <Row gap={6}>
                  <Icon name="plus-circle-outline" size={16} color={c.primary} />
                  <Txt variant="caption" tone="primary" style={{ fontWeight: '700' }}>
                    Fazer a primeira avaliação
                  </Txt>
                </Row>
              )}
            </Card>
          );
        })}
      </Section>
    </Screen>
  );
}
