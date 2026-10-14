import Constants from 'expo-constants';
import { useState } from 'react';
import { Alert, Platform, Share, Switch, TextInput, View } from 'react-native';

import { Button, Card, Chip, Divider, Row, Screen, Section, Txt } from '../components/ui';
import { PAID_FEATURE_OPTIONS, summarizeMetrics, type WouldPay } from '../domain/metrics';
import { useAppStore } from '../store/useAppStore';
import { radius, spacing, useTheme } from '../theme';

const FILTER_LABEL: Record<string, string> = {
  regiao: 'Região',
  objetivo: 'Objetivo',
  categoria: 'Acessório',
  tipo: 'Tipo de movimento',
  nivel: 'Nível',
  kit: 'Só com o meu kit',
  revisados: 'Somente revisados',
  mapa: 'Mapa corporal',
};

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Row style={{ justifyContent: 'space-between', paddingVertical: 6 }}>
      <Txt tone="muted" style={{ flex: 1 }}>
        {label}
      </Txt>
      <Txt variant="bodyStrong">{value}</Txt>
    </Row>
  );
}

export default function ValidationScreen() {
  const { c } = useTheme();
  const ativo = useAppStore((s) => s.validacaoAtiva);
  const setAtivo = useAppStore((s) => s.setValidacaoAtiva);
  const eventos = useAppStore((s) => s.eventos);
  const respostas = useAppStore((s) => s.respostas);
  const addResposta = useAppStore((s) => s.addResposta);
  const limparMetricas = useAppStore((s) => s.limparMetricas);
  const kit = useAppStore((s) => s.kit);

  const [voltaria, setVoltaria] = useState<number | null>(null);
  const [pagaria, setPagaria] = useState<WouldPay | null>(null);
  const [recursos, setRecursos] = useState<string[]>([]);
  const [comentario, setComentario] = useState('');
  const [enviado, setEnviado] = useState(false);

  const resumo = summarizeMetrics(eventos, respostas);

  const salvarResposta = () => {
    if (voltaria === null || pagaria === null) return;
    addResposta({ t: Date.now(), voltaria, pagaria, recursos, comentario: comentario.trim() || undefined });
    setEnviado(true);
    setVoltaria(null);
    setPagaria(null);
    setRecursos([]);
    setComentario('');
  };

  const exportar = async () => {
    const payload = {
      app: 'MobiliApp',
      versao: Constants.expoConfig?.version,
      exportadoEm: new Date().toISOString(),
      kit,
      resumo,
      respostas,
      eventos,
    };
    try {
      await Share.share({ title: 'Métricas MobiliApp', message: JSON.stringify(payload, null, 2) });
    } catch {
      // Compartilhamento cancelado.
    }
  };

  const limpar = () => {
    if (Platform.OS === 'web') {
      limparMetricas();
      return;
    }
    Alert.alert('Apagar métricas?', 'Eventos e respostas deste aparelho serão apagados.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Apagar', style: 'destructive', onPress: limparMetricas },
    ]);
  };

  return (
    <Screen>
      <Txt tone="muted">
        Use este modo nas sessões de teste com 10 a 15 praticantes e alguns profissionais. O app registra, só neste aparelho, se a
        pessoa encontrou um movimento compatível, quanto tempo levou, quais filtros usou e se montou uma sequência.
      </Txt>

      <Card>
        <Row style={{ justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <Txt variant="bodyStrong">Registrar métricas</Txt>
            <Txt variant="caption" tone="muted">
              Nada é enviado automaticamente. Você exporta quando quiser.
            </Txt>
          </View>
          <Switch value={ativo} onValueChange={setAtivo} trackColor={{ true: c.primary, false: c.border }} accessibilityLabel="Registrar métricas" />
        </Row>
      </Card>

      <Section title="Resultados neste aparelho">
        <Card style={{ gap: 0 }}>
          <Metric label="Sessões registradas" value={String(resumo.sessoes)} />
          <Divider />
          <Metric label="Encontrou movimento compatível com o kit" value={resumo.encontrouCompativel ? 'Sim' : 'Ainda não'} />
          <Divider />
          <Metric
            label="Tempo até encontrar (mediana)"
            value={resumo.tempoAteEncontrarSeg === null ? '—' : `${resumo.tempoAteEncontrarSeg} s`}
          />
          <Divider />
          <Metric label="Exercícios abertos" value={String(resumo.exerciciosVistos)} />
          <Divider />
          <Metric label="Sequências geradas / iniciadas / concluídas" value={`${resumo.sequenciasGeradas} / ${resumo.sequenciasIniciadas} / ${resumo.sequenciasConcluidas}`} />
          <Divider />
          <Metric label="Rotinas compartilhadas" value={String(resumo.rotinasCompartilhadas)} />
        </Card>
        {Object.keys(resumo.filtrosUsados).length > 0 ? (
          <Card>
            <Txt variant="label" tone="muted">
              FILTROS E CATEGORIAS USADOS
            </Txt>
            <Row wrap gap={6}>
              {Object.entries(resumo.filtrosUsados)
                .sort((a, b) => b[1] - a[1])
                .map(([k, n]) => (
                  <Chip key={k} small label={`${FILTER_LABEL[k] ?? k} · ${n}`} />
                ))}
            </Row>
          </Card>
        ) : null}
      </Section>

      <Section title="Questionário rápido" subtitle="Peça para a pessoa responder ao final do teste.">
        <Card style={{ gap: spacing.md }}>
          <View style={{ gap: spacing.sm }}>
            <Txt variant="bodyStrong">Voltaria a usar o MobiliApp?</Txt>
            <Row wrap>
              {[1, 2, 3, 4, 5].map((n) => (
                <Chip key={n} label={String(n)} selected={voltaria === n} onPress={() => setVoltaria(n)} />
              ))}
            </Row>
            <Txt variant="caption" tone="muted">
              1 = com certeza não · 5 = com certeza sim
            </Txt>
          </View>
          <View style={{ gap: spacing.sm }}>
            <Txt variant="bodyStrong">Pagaria por recursos adicionais?</Txt>
            <Row wrap>
              {(
                [
                  ['sim', 'Sim'],
                  ['talvez', 'Talvez'],
                  ['nao', 'Não'],
                ] as [WouldPay, string][]
              ).map(([v, label]) => (
                <Chip key={v} label={label} selected={pagaria === v} onPress={() => setPagaria(v)} />
              ))}
            </Row>
          </View>
          <View style={{ gap: spacing.sm }}>
            <Txt variant="bodyStrong">Quais recursos?</Txt>
            <View style={{ gap: spacing.sm }}>
              {PAID_FEATURE_OPTIONS.map((r) => (
                <Chip
                  key={r}
                  small
                  icon={recursos.includes(r) ? 'checkbox-marked' : 'checkbox-blank-outline'}
                  label={r}
                  selected={recursos.includes(r)}
                  onPress={() => setRecursos(recursos.includes(r) ? recursos.filter((x) => x !== r) : [...recursos, r])}
                />
              ))}
            </View>
          </View>
          <TextInput
            value={comentario}
            onChangeText={setComentario}
            placeholder="Comentário livre (opcional)"
            placeholderTextColor={c.textMuted}
            multiline
            maxLength={500}
            accessibilityLabel="Comentário livre"
            style={{ minHeight: 70, borderWidth: 1, borderColor: c.border, borderRadius: radius.md, padding: spacing.md, color: c.text, fontSize: 14, textAlignVertical: 'top' }}
          />
          <Button icon="send" label="Registrar resposta" disabled={voltaria === null || pagaria === null} onPress={salvarResposta} />
          {enviado ? (
            <Txt variant="caption" tone="success" style={{ textAlign: 'center' }}>
              Resposta registrada. Total: {respostas.length}.
            </Txt>
          ) : null}
        </Card>
      </Section>

      <Txt variant="caption" tone="muted">
        Lembrete: esta amostra serve para uma primeira validação qualitativa. Depois, teste retenção e disposição real de pagamento.
      </Txt>

      <View style={{ gap: spacing.sm }}>
        <Button variant="secondary" icon="export-variant" label="Exportar métricas (JSON)" onPress={exportar} />
        <Button variant="danger" icon="delete-outline" label="Apagar métricas" onPress={limpar} />
      </View>
    </Screen>
  );
}
