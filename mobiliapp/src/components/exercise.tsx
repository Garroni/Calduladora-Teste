import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Linking, Pressable, View } from 'react-native';

import { EQUIPMENT, EQUIPMENT_BY_ID, EQUIP_CATEGORIES, MOVEMENT_TYPE_BY_ID, REGION_BY_ID, REVIEW_LABEL } from '../data/taxonomy';
import type { EquipId, Exercise, MovementType, ReviewStatus } from '../data/types';
import { describeMissing, isCompatible, type Kit } from '../domain/catalog';
import { radius, spacing, useTheme } from '../theme';
import { Badge, Card, Icon, Row, Txt } from './ui';

export const MOVEMENT_ICON: Record<MovementType, string> = {
  liberacao: 'spa-outline',
  mobilidade: 'sync',
  alongamento: 'yoga',
  controle: 'target',
  integracao: 'human-greeting',
};

export function ReviewBadge({ status, compact }: { status: ReviewStatus; compact?: boolean }) {
  const info = REVIEW_LABEL[status];
  if (status === 'revisado') return <Badge tone="success" icon="check-decagram" label={compact ? 'Revisado' : info.titulo} />;
  if (status === 'em_revisao') return <Badge tone="neutral" icon="clock-outline" label={compact ? 'Em revisão' : info.titulo} />;
  return <Badge tone="warning" icon="alert-decagram" label={compact ? 'Não validado' : info.titulo} />;
}

export function ExerciseThumb({ tipo, size = 52 }: { tipo: MovementType; size?: number }) {
  const { c } = useTheme();
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius.md,
        backgroundColor: c.primarySoft,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Icon name={MOVEMENT_ICON[tipo]} size={size * 0.5} color={c.primary} />
    </View>
  );
}

export function EquipmentIcons({ exercise }: { exercise: Exercise }) {
  const { c } = useTheme();
  if (exercise.requisitos.length === 0) {
    return (
      <Row gap={4}>
        <Icon name="human" size={14} color={c.textMuted} />
        <Txt variant="caption" tone="muted">
          Sem acessórios
        </Txt>
      </Row>
    );
  }
  return (
    <Txt variant="caption" tone="muted" numberOfLines={1}>
      {exercise.requisitos.map((slot) => slot.map((e) => EQUIPMENT_BY_ID[e].nome).join(' / ')).join(' + ')}
    </Txt>
  );
}

export function ExerciseCard({
  exercise,
  kit,
  onPress,
  right,
}: {
  exercise: Exercise;
  kit: Kit;
  onPress?: () => void;
  right?: ReactNode;
}) {
  const { c } = useTheme();
  const compatible = isCompatible(exercise, kit);
  const missing = compatible ? null : describeMissing(exercise, kit);
  return (
    <Card
      onPress={onPress ?? (() => router.push(`/exercicio/${exercise.id}`))}
      accessibilityLabel={`${exercise.nome}${missing ? `. Falta: ${missing}` : ''}`}
      style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md }}
    >
      <ExerciseThumb tipo={exercise.tipo} />
      <View style={{ flex: 1, gap: 3 }}>
        <Txt variant="bodyStrong" numberOfLines={2}>
          {exercise.nome}
        </Txt>
        <Txt variant="caption" tone="muted" numberOfLines={1}>
          {MOVEMENT_TYPE_BY_ID[exercise.tipo].nome} · {exercise.regioes.map((r) => REGION_BY_ID[r].curto).join(', ')}
        </Txt>
        {missing ? (
          <Row gap={4}>
            <Icon name="swap-horizontal" size={14} color={c.accent} />
            <Txt variant="caption" tone="accent" numberOfLines={1} style={{ flex: 1 }}>
              Falta: {missing}
            </Txt>
          </Row>
        ) : (
          <EquipmentIcons exercise={exercise} />
        )}
      </View>
      {right ?? <Icon name="chevron-right" size={22} color={c.textMuted} />}
    </Card>
  );
}

export function EquipmentPicker({
  selected,
  onToggle,
}: {
  selected: EquipId[];
  onToggle: (e: EquipId) => void;
}) {
  const { c } = useTheme();
  return (
    <View style={{ gap: spacing.lg }}>
      {EQUIP_CATEGORIES.map((cat) => (
        <View key={cat.id} style={{ gap: spacing.sm }}>
          <View>
            <Txt variant="label" tone="muted">
              {cat.nome.toUpperCase()}
            </Txt>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            {EQUIPMENT.filter((e) => e.categoria === cat.id).map((e) => {
              const on = selected.includes(e.id);
              return (
                <Pressable
                  key={e.id}
                  onPress={() => onToggle(e.id)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: on }}
                  accessibilityLabel={e.nome}
                  style={({ pressed }) => ({
                    width: '31%',
                    flexGrow: 1,
                    minWidth: 96,
                    maxWidth: 160,
                    paddingVertical: spacing.md,
                    paddingHorizontal: spacing.sm,
                    borderRadius: radius.md,
                    borderWidth: 1.5,
                    borderColor: on ? c.primary : c.border,
                    backgroundColor: on ? c.primarySoft : c.surface,
                    alignItems: 'center',
                    gap: 6,
                    opacity: pressed ? 0.8 : 1,
                  })}
                >
                  <Icon name={e.icone} size={26} color={on ? c.primary : c.textMuted} />
                  <Txt
                    variant="caption"
                    style={{ textAlign: 'center', fontWeight: on ? '700' : '500', color: on ? c.primarySoftText : c.text }}
                  >
                    {e.nome}
                  </Txt>
                  {on ? (
                    <View style={{ position: 'absolute', top: 6, right: 6 }}>
                      <Icon name="check-circle" size={16} color={c.primary} />
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}
    </View>
  );
}

/** Espaço da demonstração em vídeo/animação. Mostra o vídeo quando houver URL licenciada. */
export function DemoPlaceholder({ exercise }: { exercise: Exercise }) {
  const { c } = useTheme();
  const hasVideo = !!exercise.videoUrl;
  return (
    <Pressable
      disabled={!hasVideo}
      onPress={() => exercise.videoUrl && Linking.openURL(exercise.videoUrl)}
      accessibilityRole={hasVideo ? 'button' : undefined}
      accessibilityLabel={hasVideo ? 'Assistir demonstração' : 'Demonstração em produção'}
      style={{
        height: 180,
        borderRadius: radius.lg,
        backgroundColor: c.primarySoft,
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        overflow: 'hidden',
      }}
    >
      <View style={{ position: 'absolute', width: 260, height: 260, borderRadius: 130, borderWidth: 28, borderColor: c.primary, opacity: 0.07, top: -60, right: -70 }} />
      <View style={{ position: 'absolute', width: 160, height: 160, borderRadius: 80, backgroundColor: c.primary, opacity: 0.06, bottom: -50, left: -40 }} />
      <Icon name={hasVideo ? 'play-circle' : MOVEMENT_ICON[exercise.tipo]} size={56} color={c.primary} />
      <Txt variant="caption" style={{ color: c.primarySoftText, fontWeight: '600' }}>
        {hasVideo ? 'Assistir demonstração' : 'Vídeo demonstrativo em produção'}
      </Txt>
    </Pressable>
  );
}
