import { router } from 'expo-router';
import { useState } from 'react';
import { Switch, TextInput, View } from 'react-native';

import { SequenceItemRow } from '../components/sequence';
import { Badge, Button, Card, EmptyState, Icon, Row, Screen, Txt } from '../components/ui';
import { OBJECTIVE_BY_ID, REGION_BY_ID } from '../data/taxonomy';
import type { SequenceItem } from '../data/types';
import { buildSequence, sequenceSeconds } from '../domain/sequence';
import { formatDuration } from '../domain/text';
import { useAppStore } from '../store/useAppStore';
import { radius, spacing, useTheme } from '../theme';

export default function SequenceEditorScreen() {
  const { c } = useTheme();
  const rascunho = useAppStore((s) => s.rascunho);
  const info = useAppStore((s) => s.rascunhoInfo);
  const kit = useAppStore((s) => s.kit);
  const nivel = useAppStore((s) => s.nivel);
  const modoPro = useAppStore((s) => s.modoPro);
  const nomeProfissional = useAppStore((s) => s.nomeProfissional);
  const updateRascunho = useAppStore((s) => s.updateRascunho);
  const setRascunhoItens = useAppStore((s) => s.setRascunhoItens);
  const setRascunho = useAppStore((s) => s.setRascunho);
  const salvarRascunho = useAppStore((s) => s.salvarRascunho);
  const track = useAppStore((s) => s.track);
  const [swapIndex, setSwapIndex] = useState<number | null>(null);

  if (!rascunho) {
    return (
      <Screen>
        <EmptyState
          icon="playlist-remove"
          title="Nenhuma sequência em edição"
          text="Monte uma sequência a partir da aba Montar."
          action={{ label: 'Ir para Montar', onPress: () => router.replace('/montar') }}
        />
      </Screen>
    );
  }

  const itens = rascunho.itens;
  const total = sequenceSeconds(itens);
  const setItem = (i: number, item: SequenceItem) => {
    const next = [...itens];
    next[i] = item;
    setRascunhoItens(next);
    if (item.exerciseId !== itens[i].exerciseId) {
      setSwapIndex(null);
      track('alternativa_vista', { de: itens[i].exerciseId, para: item.exerciseId, origem: 'sequencia' });
    }
  };
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= itens.length) return;
    const next = [...itens];
    [next[i], next[j]] = [next[j], next[i]];
    setRascunhoItens(next);
    setSwapIndex(null);
  };
  const remove = (i: number) => {
    setRascunhoItens(itens.filter((_, k) => k !== i));
    setSwapIndex(null);
  };

  const canRegenerate = rascunho.origem === 'gerada' && rascunho.objetivo && info?.seed !== undefined;
  const regenerate = () => {
    if (!rascunho.objetivo || info?.seed === undefined) return;
    const seed = info.seed + 1;
    const minutos = rascunho.tempoAlvoMin ?? info.minutos ?? 10;
    const out = buildSequence({ kit, objetivo: rascunho.objetivo, regiao: rascunho.regiao, minutos, nivel, seed });
    setRascunho({ ...rascunho, itens: out.itens, atualizadaEm: new Date().toISOString() }, { avisos: out.avisos, seed, minutos });
    setSwapIndex(null);
    track('sequencia_gerada', { objetivo: rascunho.objetivo, outraOpcao: true });
  };

  const salvar = () => {
    if (modoPro && nomeProfissional && !rascunho.autor) updateRascunho({ autor: nomeProfissional });
    const saved = salvarRascunho();
    if (!saved) return;
    track('rotina_salva', { itens: saved.itens.length });
    setRascunho(null);
    router.replace(`/rotinas/${saved.id}`);
  };

  return (
    <Screen>
      <Card>
        <Txt variant="label" tone="muted">
          NOME DA SEQUÊNCIA
        </Txt>
        <TextInput
          value={rascunho.nome}
          onChangeText={(nome) => updateRascunho({ nome })}
          placeholder="Ex.: Aquecimento de pernas"
          placeholderTextColor={c.textMuted}
          accessibilityLabel="Nome da sequência"
          maxLength={80}
          multiline
          submitBehavior="blurAndSubmit"
          returnKeyType="done"
          style={{ fontSize: 20, fontWeight: '700', color: c.text, paddingVertical: 4 }}
        />
        <Row wrap gap={6}>
          <Badge tone="primary" icon="timer-outline" label={formatDuration(total)} />
          <Badge label={`${itens.length} ${itens.length === 1 ? 'exercício' : 'exercícios'}`} />
          {rascunho.objetivo ? <Badge label={OBJECTIVE_BY_ID[rascunho.objetivo].nome} /> : null}
          {rascunho.regiao ? <Badge label={REGION_BY_ID[rascunho.regiao].curto} /> : null}
        </Row>
        {rascunho.tempoAlvoMin && itens.length > 0 ? (
          <Txt variant="caption" tone="muted">
            O tempo total já inclui transições e trocas de lado. Meta: {rascunho.tempoAlvoMin} min.
          </Txt>
        ) : null}
      </Card>

      {info?.avisos.map((aviso, i) => (
        <View
          key={i}
          style={{ flexDirection: 'row', gap: spacing.sm, padding: spacing.md, borderRadius: radius.md, backgroundColor: c.warningSoft }}
        >
          <Icon name="information-outline" size={18} color={c.warning} />
          <Txt variant="caption" style={{ flex: 1 }}>
            {aviso}
          </Txt>
        </View>
      ))}

      {modoPro ? (
        <Card>
          <Txt variant="label" tone="muted">
            OBSERVAÇÕES PARA O ALUNO
          </Txt>
          <TextInput
            value={rascunho.notas ?? ''}
            onChangeText={(notas) => updateRascunho({ notas })}
            placeholder="Ex.: Faça antes do treino de pernas. Respire devagar."
            placeholderTextColor={c.textMuted}
            multiline
            maxLength={500}
            accessibilityLabel="Observações para o aluno"
            style={{ minHeight: 60, fontSize: 15, color: c.text, textAlignVertical: 'top' }}
          />
          <Row style={{ justifyContent: 'space-between' }}>
            <Txt>Salvar como modelo reutilizável</Txt>
            <Switch
              value={!!rascunho.modelo}
              onValueChange={(modelo) => updateRascunho({ modelo })}
              trackColor={{ true: c.primary, false: c.border }}
              accessibilityLabel="Salvar como modelo"
            />
          </Row>
        </Card>
      ) : null}

      {itens.length === 0 ? (
        <EmptyState icon="playlist-plus" title="Sequência vazia" text="Adicione exercícios da biblioteca para montar sua rotina." />
      ) : (
        <View style={{ gap: spacing.sm }}>
          {itens.map((item, i) => (
            <SequenceItemRow
              key={`${item.exerciseId}-${i}`}
              index={i}
              item={item}
              kit={kit}
              nivel={nivel}
              editable
              isFirst={i === 0}
              isLast={i === itens.length - 1}
              swapOpen={swapIndex === i}
              onChange={(next) => setItem(i, next)}
              onMove={(dir) => move(i, dir)}
              onRemove={() => remove(i)}
              onToggleSwap={() => setSwapIndex(swapIndex === i ? null : i)}
            />
          ))}
        </View>
      )}

      <Button variant="ghost" icon="plus" label="Adicionar exercício" onPress={() => router.push('/adicionar')} />

      <View style={{ gap: spacing.sm }}>
        <Button
          icon="play"
          label="Iniciar agora"
          disabled={itens.length === 0}
          onPress={() => router.push({ pathname: '/player', params: { id: 'rascunho' } })}
        />
        <Button variant="secondary" icon="content-save-outline" label="Salvar nas minhas rotinas" disabled={itens.length === 0} onPress={salvar} />
        {canRegenerate ? <Button variant="ghost" icon="shuffle-variant" label="Gerar outra opção" onPress={regenerate} /> : null}
      </View>
    </Screen>
  );
}
