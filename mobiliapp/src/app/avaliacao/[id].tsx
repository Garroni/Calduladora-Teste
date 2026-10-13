import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Platform, Switch, TextInput, useWindowDimensions, View } from 'react-native';

import { LineChart } from '../../components/LineChart';
import { NumberedSteps } from '../../components/layout';
import { Button, Card, Chip, EmptyState, Icon, IconButton, Row, Screen, Section, Txt } from '../../components/ui';
import { ASSESSMENT_BY_ID, TIME_OF_DAY_LABEL, type AssessmentProtocol, type TimeOfDay } from '../../data/assessments';
import { asymmetry, entriesFor, formatValue, isComparable, summarize } from '../../domain/assessment';
import { formatDate, newId } from '../../domain/text';
import { useAppStore } from '../../store/useAppStore';
import { radius, spacing, useTheme } from '../../theme';

function parseNumber(text: string): number | null {
  const n = Number(text.replace(',', '.').trim());
  return text.trim() !== '' && Number.isFinite(n) ? n : null;
}

function currentPeriod(): TimeOfDay {
  const h = new Date().getHours();
  return h < 12 ? 'manha' : h < 18 ? 'tarde' : 'noite';
}

function NumberField({
  label,
  value,
  onChange,
  protocol,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  protocol: AssessmentProtocol;
}) {
  const { c } = useTheme();
  const n = parseNumber(value);
  const invalid = value.trim() !== '' && (n === null || n < protocol.min || n > protocol.max);
  return (
    <View style={{ flex: 1, gap: 4 }}>
      <Txt variant="label" tone="muted">
        {label.toUpperCase()}
      </Txt>
      <Row
        style={{
          borderWidth: 1.5,
          borderColor: invalid ? c.danger : c.border,
          borderRadius: radius.md,
          backgroundColor: c.surface,
          paddingHorizontal: spacing.md,
        }}
      >
        <TextInput
          value={value}
          onChangeText={onChange}
          keyboardType={protocol.min < 0 ? 'numbers-and-punctuation' : 'decimal-pad'}
          placeholder="0"
          placeholderTextColor={c.textMuted}
          accessibilityLabel={`${label} em ${protocol.unidade}`}
          style={{ flex: 1, fontSize: 22, fontWeight: '700', color: c.text, paddingVertical: 10 }}
        />
        <Txt tone="muted">{protocol.unidade}</Txt>
      </Row>
      {invalid ? (
        <Txt variant="caption" tone="danger">
          Entre {protocol.min} e {protocol.max}
        </Txt>
      ) : null}
    </View>
  );
}

export default function AssessmentScreen() {
  const { c } = useTheme();
  const { width } = useWindowDimensions();
  const { id } = useLocalSearchParams<{ id: string }>();
  const protocol = id && Object.prototype.hasOwnProperty.call(ASSESSMENT_BY_ID, id) ? ASSESSMENT_BY_ID[id] : undefined;
  const avaliacoes = useAppStore((s) => s.avaliacoes);
  const addAvaliacao = useAppStore((s) => s.addAvaliacao);
  const removerAvaliacao = useAppStore((s) => s.removerAvaliacao);

  const [valor, setValor] = useState('');
  const [valorEsq, setValorEsq] = useState('');
  const [pontos, setPontos] = useState<number | null>(null);
  const [periodo, setPeriodo] = useState<TimeOfDay>(currentPeriod());
  const [aquecido, setAquecido] = useState(false);
  const [observacao, setObservacao] = useState('');
  const [salvo, setSalvo] = useState(false);

  if (!protocol) {
    return (
      <Screen>
        <EmptyState icon="help-circle-outline" title="Avaliação não encontrada" action={{ label: 'Voltar', onPress: () => router.back() }} />
      </Screen>
    );
  }

  const entries = entriesFor(avaliacoes, protocol.id);
  const summary = summarize(avaliacoes, protocol);
  const isScale = protocol.unidade === 'pontos';
  const inRange = (n: number | null) => n !== null && n >= protocol.min && n <= protocol.max;
  const v1 = isScale ? pontos : parseNumber(valor);
  const v2 = parseNumber(valorEsq);
  const canSave = inRange(v1) && (!protocol.bilateral || inRange(v2));

  const save = () => {
    if (!canSave || v1 === null) return;
    addAvaliacao({
      id: newId('a'),
      protocoloId: protocol.id,
      data: new Date().toISOString(),
      valor: v1,
      valorEsquerdo: protocol.bilateral && v2 !== null ? v2 : undefined,
      periodo,
      aquecido,
      observacao: observacao.trim() || undefined,
    });
    setValor('');
    setValorEsq('');
    setPontos(null);
    setObservacao('');
    setSalvo(true);
  };

  const remove = (entryId: string) => {
    if (Platform.OS === 'web') {
      removerAvaliacao(entryId);
      return;
    }
    Alert.alert('Excluir medição?', undefined, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: () => removerAvaliacao(entryId) },
    ]);
  };

  const chartWidth = Math.min(width, 640) - spacing.lg * 4;
  const series = protocol.bilateral
    ? [
        { label: 'Direito', values: entries.map((e) => e.valor), color: c.primary },
        { label: 'Esquerdo', values: entries.map((e) => e.valorEsquerdo ?? e.valor), color: c.accent },
      ]
    : [{ label: protocol.nome, values: entries.map((e) => e.valor), color: c.primary }];

  return (
    <Screen>
      <View style={{ gap: spacing.sm }}>
        <Txt variant="title">{protocol.nome}</Txt>
        <Txt tone="muted">{protocol.resumo}</Txt>
        <Row gap={6}>
          <Icon name="toolbox-outline" size={16} color={c.textMuted} />
          <Txt variant="caption" tone="muted">
            {protocol.materiais}
          </Txt>
        </Row>
      </View>

      <Section title="Protocolo">
        <NumberedSteps steps={protocol.passos} />
        <View style={{ padding: spacing.md, borderRadius: radius.md, backgroundColor: c.primarySoft }}>
          <Txt variant="caption" style={{ color: c.primarySoftText }}>
            <Txt variant="caption" style={{ fontWeight: '700', color: c.primarySoftText }}>
              Como registrar:{' '}
            </Txt>
            {protocol.comoMedir}
          </Txt>
        </View>
      </Section>

      <Section title="Nova medição">
        <Card style={{ gap: spacing.md }}>
          {isScale ? (
            <View style={{ gap: spacing.sm }}>
              {protocol.escala?.map((item) => (
                <Chip
                  key={item.valor}
                  label={`${item.valor} · ${item.descricao}`}
                  selected={pontos === item.valor}
                  onPress={() => setPontos(item.valor)}
                />
              ))}
            </View>
          ) : (
            <Row style={{ alignItems: 'flex-start' }} gap={spacing.md}>
              <NumberField label={protocol.bilateral ? 'Direito' : 'Valor'} value={valor} onChange={setValor} protocol={protocol} />
              {protocol.bilateral ? <NumberField label="Esquerdo" value={valorEsq} onChange={setValorEsq} protocol={protocol} /> : null}
            </Row>
          )}

          <View style={{ gap: spacing.sm }}>
            <Txt variant="label" tone="muted">
              CONDIÇÕES (PARA COMPARAR DEPOIS)
            </Txt>
            <Row wrap>
              {(Object.keys(TIME_OF_DAY_LABEL) as TimeOfDay[]).map((p) => (
                <Chip key={p} small label={TIME_OF_DAY_LABEL[p]} selected={periodo === p} onPress={() => setPeriodo(p)} />
              ))}
            </Row>
            <Row style={{ justifyContent: 'space-between' }}>
              <Txt>Fiz aquecimento antes</Txt>
              <Switch value={aquecido} onValueChange={setAquecido} trackColor={{ true: c.primary, false: c.border }} accessibilityLabel="Fiz aquecimento antes" />
            </Row>
          </View>

          <TextInput
            value={observacao}
            onChangeText={setObservacao}
            placeholder="Observação (opcional): ex.: descalço, após treino de pernas"
            placeholderTextColor={c.textMuted}
            maxLength={200}
            accessibilityLabel="Observação"
            style={{
              borderWidth: 1,
              borderColor: c.border,
              borderRadius: radius.md,
              padding: spacing.md,
              color: c.text,
              fontSize: 14,
            }}
          />
          <Button icon="content-save-outline" label="Salvar medição" disabled={!canSave} onPress={save} />
          {salvo ? (
            <Txt variant="caption" tone="success" style={{ textAlign: 'center' }}>
              Medição salva.
            </Txt>
          ) : null}
        </Card>
      </Section>

      {entries.length > 0 ? (
        <Section title="Histórico" subtitle={`${entries.length} ${entries.length === 1 ? 'medição' : 'medições'}`}>
          {entries.length > 1 ? (
            <Card style={{ alignItems: 'center' }}>
              <LineChart series={series} width={chartWidth} formatY={(v) => String(v)} />
            </Card>
          ) : null}
          {summary.evolucao !== undefined && summary.referencia ? (
            <Txt variant="caption" tone="muted">
              Comparando com {formatDate(summary.referencia.data)}, feita nas mesmas condições ({TIME_OF_DAY_LABEL[summary.referencia.periodo].toLowerCase()},{' '}
              {summary.referencia.aquecido ? 'aquecido' : 'sem aquecimento'}).
            </Txt>
          ) : null}
          <Card style={{ gap: spacing.md }}>
            {[...entries].reverse().map((e) => {
              const asym = asymmetry(e);
              const comparable = summary.ultimo && e.id !== summary.ultimo.id && isComparable(e, summary.ultimo);
              return (
                <Row key={e.id} style={{ alignItems: 'flex-start' }}>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Txt variant="bodyStrong">
                      {protocol.bilateral
                        ? `D ${formatValue(e.valor, protocol)} · E ${formatValue(e.valorEsquerdo ?? e.valor, protocol)}`
                        : formatValue(e.valor, protocol)}
                    </Txt>
                    <Txt variant="caption" tone="muted">
                      {formatDate(e.data)} · {TIME_OF_DAY_LABEL[e.periodo]} · {e.aquecido ? 'aquecido' : 'sem aquecimento'}
                      {comparable ? ' · comparável' : ''}
                    </Txt>
                    {asym !== null && asym >= 2 ? (
                      <Txt variant="caption" tone="warning">
                        Diferença de {formatValue(asym, protocol)} entre os lados.
                      </Txt>
                    ) : null}
                    {e.observacao ? (
                      <Txt variant="caption" tone="muted">
                        “{e.observacao}”
                      </Txt>
                    ) : null}
                  </View>
                  <IconButton icon="delete-outline" label="Excluir medição" size={20} color={c.textMuted} onPress={() => remove(e.id)} />
                </Row>
              );
            })}
          </Card>
        </Section>
      ) : null}
    </Screen>
  );
}
