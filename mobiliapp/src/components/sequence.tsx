import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

import { EXERCISE_BY_ID } from '../data/exercises';
import { MOVEMENT_TYPE_BY_ID } from '../data/taxonomy';
import type { Difficulty, SequenceItem } from '../data/types';
import { describeMissing, findAlternatives, isCompatible, type Kit } from '../domain/catalog';
import { MAX_TRABALHO_SEG, MIN_TRABALHO_SEG, PASSO_TRABALHO_SEG, sidesOf } from '../domain/sequence';
import { radius, spacing, useTheme } from '../theme';
import { ExerciseThumb } from './exercise';
import { Chip, Icon, IconButton, Row, Stepper, Txt } from './ui';

function workLabel(item: SequenceItem) {
  return sidesOf(item.exerciseId) === 2 ? `${item.trabalhoSeg} s por lado` : `${item.trabalhoSeg} s`;
}

export function SequenceItemRow({
  index,
  item,
  kit,
  nivel,
  editable,
  swapOpen,
  isFirst,
  isLast,
  onChange,
  onMove,
  onRemove,
  onToggleSwap,
}: {
  index: number;
  item: SequenceItem;
  kit: Kit;
  nivel?: Difficulty;
  editable?: boolean;
  swapOpen?: boolean;
  isFirst?: boolean;
  isLast?: boolean;
  onChange?: (item: SequenceItem) => void;
  onMove?: (dir: -1 | 1) => void;
  onRemove?: () => void;
  onToggleSwap?: () => void;
}) {
  const { c } = useTheme();
  const ex = EXERCISE_BY_ID[item.exerciseId];
  if (!ex) return null;
  const missing = isCompatible(ex, kit) ? null : describeMissing(ex, kit);
  const alternatives = swapOpen ? findAlternatives(ex, kit, { dificuldadeMax: nivel }).equivalentes : [];

  return (
    <View
      style={{
        backgroundColor: c.surface,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: missing ? c.accent : c.border,
        overflow: 'hidden',
      }}
    >
      <Pressable
        onPress={() => router.push(`/exercicio/${ex.id}`)}
        accessibilityRole="button"
        accessibilityLabel={`${index + 1}. ${ex.nome}, ${workLabel(item)}`}
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.md,
          padding: spacing.md,
          opacity: pressed ? 0.85 : 1,
        })}
      >
        <View style={{ alignItems: 'center', gap: 4 }}>
          <ExerciseThumb tipo={ex.tipo} size={44} />
          <Txt variant="label" tone="muted">
            {index + 1}
          </Txt>
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Txt variant="bodyStrong" numberOfLines={2}>
            {ex.nome}
          </Txt>
          <Txt variant="caption" tone="muted">
            {MOVEMENT_TYPE_BY_ID[ex.tipo].nome} · {workLabel(item)}
          </Txt>
          <Txt variant="caption" tone="muted" numberOfLines={1}>
            {ex.dosagem}
          </Txt>
          {missing ? (
            <Txt variant="caption" tone="accent" numberOfLines={1}>
              Falta: {missing}
            </Txt>
          ) : null}
        </View>
        {!editable ? <Icon name="chevron-right" size={20} color={c.textMuted} /> : null}
      </Pressable>

      {editable ? (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTopWidth: 1,
            borderTopColor: c.border,
            paddingHorizontal: spacing.xs,
            backgroundColor: c.surfaceAlt,
          }}
        >
          <Stepper
            value={item.trabalhoSeg}
            onChange={(v) => onChange?.({ ...item, trabalhoSeg: v })}
            step={PASSO_TRABALHO_SEG}
            min={MIN_TRABALHO_SEG}
            max={MAX_TRABALHO_SEG}
            format={(v) => `${v} s`}
            label="tempo de trabalho"
          />
          <Row gap={0}>
            <IconButton icon="arrow-up" label="Mover para cima" onPress={() => onMove?.(-1)} disabled={isFirst} size={20} />
            <IconButton icon="arrow-down" label="Mover para baixo" onPress={() => onMove?.(1)} disabled={isLast} size={20} />
            <IconButton
              icon="swap-horizontal"
              label="Trocar por alternativa"
              onPress={() => onToggleSwap?.()}
              color={swapOpen ? c.primary : undefined}
              size={20}
            />
            <IconButton icon="delete-outline" label="Remover" onPress={() => onRemove?.()} color={c.danger} size={20} />
          </Row>
        </View>
      ) : null}

      {swapOpen ? (
        <View style={{ padding: spacing.md, gap: spacing.sm, borderTopWidth: 1, borderTopColor: c.border }}>
          <Txt variant="label" tone="muted">
            ALTERNATIVAS EQUIVALENTES COM O SEU KIT
          </Txt>
          {alternatives.length === 0 ? (
            <Txt variant="caption" tone="muted">
              Nenhum substituto da mesma finalidade com os acessórios que você tem.
            </Txt>
          ) : (
            <Row wrap>
              {alternatives.map((alt) => (
                <Chip
                  key={alt.id}
                  small
                  icon="swap-horizontal"
                  label={alt.nome}
                  onPress={() => onChange?.({ exerciseId: alt.id, trabalhoSeg: item.trabalhoSeg })}
                />
              ))}
            </Row>
          )}
        </View>
      ) : null}
    </View>
  );
}
