import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { EXERCISES } from '../data/exercises';
import { EQUIPMENT_BY_ID } from '../data/taxonomy';
import type { EquipId } from '../data/types';
import { isCompatible } from '../domain/catalog';
import { radius, spacing, useTheme } from '../theme';
import { Chip, Icon, Row, Txt } from './ui';

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  right,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md }}>
      <View style={{ flex: 1, gap: 4 }}>
        {eyebrow ? (
          <Txt variant="label" tone="primary">
            {eyebrow.toUpperCase()}
          </Txt>
        ) : null}
        <Txt variant="display" accessibilityRole="header">
          {title}
        </Txt>
        {subtitle ? <Txt tone="muted">{subtitle}</Txt> : null}
      </View>
      {right}
    </View>
  );
}

export function KitSummary({ kit, max = 6 }: { kit: EquipId[]; max?: number }) {
  const { c } = useTheme();
  const available = EXERCISES.filter((e) => isCompatible(e, kit)).length;
  const shown = kit.slice(0, max);
  return (
    <Pressable
      onPress={() => router.push('/equipamentos')}
      accessibilityRole="button"
      accessibilityLabel="Editar meu kit de equipamentos"
      style={({ pressed }) => ({
        backgroundColor: c.surface,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: c.border,
        padding: spacing.lg,
        gap: spacing.md,
        opacity: pressed ? 0.9 : 1,
      })}
    >
      <Row style={{ justifyContent: 'space-between' }}>
        <Row gap={spacing.sm}>
          <Icon name="bag-personal-outline" size={20} color={c.primary} />
          <Txt variant="heading">Meu kit</Txt>
        </Row>
        <Row gap={2}>
          <Txt variant="caption" tone="primary" style={{ fontWeight: '700' }}>
            Editar
          </Txt>
          <Icon name="chevron-right" size={18} color={c.primary} />
        </Row>
      </Row>
      <Row wrap gap={6}>
        {kit.length === 0 ? (
          <Chip small icon="human" label="Só peso corporal" />
        ) : (
          <>
            {shown.map((e) => (
              <Chip key={e} small icon={EQUIPMENT_BY_ID[e].icone} label={EQUIPMENT_BY_ID[e].nome} />
            ))}
            {kit.length > max ? <Chip small label={`+${kit.length - max}`} /> : null}
          </>
        )}
      </Row>
      <Txt variant="caption" tone="muted">
        {available} de {EXERCISES.length} exercícios disponíveis com o que você tem.
      </Txt>
    </Pressable>
  );
}

export function SafetyNote({ compact }: { compact?: boolean }) {
  const { c } = useTheme();
  return (
    <Pressable
      onPress={() => router.push('/sobre')}
      accessibilityRole="button"
      style={{
        flexDirection: 'row',
        gap: spacing.sm,
        padding: spacing.md,
        borderRadius: radius.md,
        backgroundColor: c.warningSoft,
        alignItems: 'flex-start',
      }}
    >
      <Icon name="shield-alert-outline" size={18} color={c.warning} style={{ marginTop: 1 }} />
      <Txt variant="caption" style={{ flex: 1, color: c.text }}>
        {compact
          ? 'Conteúdo em validação técnica. Não substitui avaliação profissional. Pare se sentir dor.'
          : 'O MobiliApp não faz diagnóstico nem substitui orientação de um profissional de saúde. Movimente-se sem dor e interrompa se sentir dor aguda, tontura ou formigamento. Toque para saber mais.'}
      </Txt>
    </Pressable>
  );
}

export function ProgressRing({
  size,
  stroke,
  progress,
  color,
  track,
  children,
}: {
  size: number;
  stroke: number;
  progress: number;
  color: string;
  track: string;
  children?: ReactNode;
}) {
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const clamped = Math.min(1, Math.max(0, progress));
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={circumference * (1 - clamped)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      {children}
    </View>
  );
}

export function NumberedSteps({ steps }: { steps: string[] }) {
  const { c } = useTheme();
  return (
    <View style={{ gap: spacing.md }}>
      {steps.map((step, i) => (
        <View key={i} style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' }}>
          <View
            style={{
              width: 26,
              height: 26,
              borderRadius: 13,
              backgroundColor: c.primary,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Txt variant="caption" tone="inverse" style={{ fontWeight: '800' }}>
              {i + 1}
            </Txt>
          </View>
          <Txt style={{ flex: 1, paddingTop: 2 }}>{step}</Txt>
        </View>
      ))}
    </View>
  );
}

export function InfoTile({ icon, label, value }: { icon: string; label: string; value: string }) {
  const { c } = useTheme();
  return (
    <View
      style={{
        flexGrow: 1,
        flexBasis: '45%',
        backgroundColor: c.surface,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: c.border,
        padding: spacing.md,
        gap: 4,
      }}
    >
      <Row gap={6}>
        <Icon name={icon} size={16} color={c.primary} />
        <Txt variant="label" tone="muted">
          {label.toUpperCase()}
        </Txt>
      </Row>
      <Txt variant="bodyStrong">{value}</Txt>
    </View>
  );
}
