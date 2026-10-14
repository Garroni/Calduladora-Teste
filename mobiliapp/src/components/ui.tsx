import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ComponentProps, ReactNode } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ScrollViewProps,
  type StyleProp,
  type TextProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { makeStyles, radius, spacing, type, useTheme, type Palette } from '../theme';

export type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

export function Icon({
  name,
  size = 20,
  color,
  style,
}: {
  name: string;
  size?: number;
  color?: string;
  style?: StyleProp<TextStyle>;
}) {
  const { c } = useTheme();
  return <MaterialCommunityIcons name={name as IconName} size={size} color={color ?? c.text} style={style} />;
}

type TextVariant = keyof typeof type;
type TextTone = 'default' | 'muted' | 'primary' | 'accent' | 'warning' | 'success' | 'danger' | 'inverse';

export function Txt({
  variant = 'body',
  tone = 'default',
  style,
  ...rest
}: TextProps & { variant?: TextVariant; tone?: TextTone }) {
  const { c } = useTheme();
  const color: Record<TextTone, string> = {
    default: c.text,
    muted: c.textMuted,
    primary: c.primary,
    accent: c.accent,
    warning: c.warning,
    success: c.success,
    danger: c.danger,
    inverse: c.primaryText,
  };
  return <Text {...rest} style={[type[variant], { color: color[tone] }, style]} />;
}

export function Screen({
  children,
  safeTop = false,
  padded = true,
  contentStyle,
  ...rest
}: ScrollViewProps & { safeTop?: boolean; padded?: boolean; contentStyle?: StyleProp<ViewStyle> }) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.bg }}
      contentContainerStyle={[
        padded && { padding: spacing.lg },
        { paddingBottom: spacing.xxl + (safeTop ? 0 : insets.bottom), gap: spacing.lg },
        safeTop && { paddingTop: insets.top + spacing.md },
        contentStyle,
      ]}
      keyboardShouldPersistTaps="handled"
      {...rest}
    >
      {children}
    </ScrollView>
  );
}

const useCardStyles = makeStyles(({ c }) =>
  StyleSheet.create({
    card: {
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      padding: spacing.lg,
      gap: spacing.sm,
    },
    pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  }),
);

export function Card({
  children,
  onPress,
  style,
  accessibilityLabel,
}: {
  children: ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}) {
  const s = useCardStyles();
  if (!onPress) return <View style={[s.card, style]}>{children}</View>;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [s.card, style, pressed && s.pressed]}
    >
      {children}
    </Pressable>
  );
}

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'accent';

function buttonColors(c: Palette, variant: ButtonVariant) {
  switch (variant) {
    case 'primary':
      return { bg: c.primary, fg: c.primaryText, border: c.primary };
    case 'accent':
      return { bg: c.accent, fg: '#FFFFFF', border: c.accent };
    case 'secondary':
      return { bg: c.primarySoft, fg: c.primarySoftText, border: c.primarySoft };
    case 'danger':
      return { bg: 'transparent', fg: c.danger, border: c.danger };
    case 'ghost':
    default:
      return { bg: 'transparent', fg: c.text, border: c.border };
  }
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  disabled,
  small,
  style,
  accessibilityLabel,
}: {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  icon?: string;
  disabled?: boolean;
  small?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}) {
  const { c } = useTheme();
  const col = buttonColors(c, variant);
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: spacing.sm,
          minHeight: small ? 38 : 50,
          paddingHorizontal: small ? spacing.md : spacing.lg,
          borderRadius: radius.md,
          backgroundColor: col.bg,
          borderWidth: 1.5,
          borderColor: col.border,
          opacity: disabled ? 0.45 : pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      {icon ? <Icon name={icon} size={small ? 18 : 20} color={col.fg} /> : null}
      <Text style={[small ? type.caption : type.bodyStrong, { color: col.fg, fontWeight: '700' }]}>{label}</Text>
    </Pressable>
  );
}

export function IconButton({
  icon,
  onPress,
  label,
  color,
  size = 22,
  disabled,
}: {
  icon: string;
  onPress: () => void;
  label: string;
  color?: string;
  size?: number;
  disabled?: boolean;
}) {
  const { c } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      style={({ pressed }) => ({
        width: 40,
        height: 40,
        borderRadius: radius.pill,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: pressed ? c.surfaceAlt : 'transparent',
        opacity: disabled ? 0.35 : 1,
      })}
    >
      <Icon name={icon} size={size} color={color ?? c.text} />
    </Pressable>
  );
}

export function Chip({
  label,
  selected,
  onPress,
  icon,
  small,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: string;
  small?: boolean;
}) {
  const { c } = useTheme();
  const fg = selected ? c.primaryText : c.text;
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityState={onPress ? { selected: !!selected } : undefined}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: small ? 10 : 14,
        paddingVertical: small ? 5 : 8,
        borderRadius: radius.pill,
        backgroundColor: selected ? c.primary : c.surface,
        borderWidth: 1,
        borderColor: selected ? c.primary : c.border,
        opacity: pressed ? 0.8 : 1,
      })}
    >
      {icon ? <Icon name={icon} size={small ? 14 : 16} color={fg} /> : null}
      <Text style={[small ? type.caption : type.bodyStrong, { color: fg, fontSize: small ? 13 : 14 }]}>{label}</Text>
    </Pressable>
  );
}

type BadgeTone = 'neutral' | 'primary' | 'warning' | 'success' | 'accent' | 'danger';

export function Badge({ label, tone = 'neutral', icon }: { label: string; tone?: BadgeTone; icon?: string }) {
  const { c } = useTheme();
  const map: Record<BadgeTone, { bg: string; fg: string }> = {
    neutral: { bg: c.surfaceAlt, fg: c.textMuted },
    primary: { bg: c.primarySoft, fg: c.primarySoftText },
    warning: { bg: c.warningSoft, fg: c.warning },
    success: { bg: c.successSoft, fg: c.success },
    accent: { bg: c.accentSoft, fg: c.accent },
    danger: { bg: c.dangerSoft, fg: c.danger },
  };
  const col = map[tone];
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: radius.pill,
        backgroundColor: col.bg,
      }}
    >
      {icon ? <Icon name={icon} size={13} color={col.fg} /> : null}
      <Text style={[type.label, { color: col.fg, letterSpacing: 0.2 }]}>{label}</Text>
    </View>
  );
}

export function Section({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: { label: string; onPress: () => void };
  children: ReactNode;
}) {
  const { c } = useTheme();
  return (
    <View style={{ gap: spacing.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: spacing.md }}>
        <View style={{ flex: 1, gap: 2 }}>
          <Txt variant="heading">{title}</Txt>
          {subtitle ? <Txt variant="caption" tone="muted">{subtitle}</Txt> : null}
        </View>
        {action ? (
          <Pressable onPress={action.onPress} accessibilityRole="button" hitSlop={8}>
            <Text style={[type.caption, { color: c.primary, fontWeight: '700' }]}>{action.label}</Text>
          </Pressable>
        ) : null}
      </View>
      {children}
    </View>
  );
}

export function Row({
  children,
  gap = spacing.sm,
  wrap,
  style,
}: {
  children: ReactNode;
  gap?: number;
  wrap?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', gap, flexWrap: wrap ? 'wrap' : 'nowrap' }, style]}>
      {children}
    </View>
  );
}

export function EmptyState({
  icon,
  title,
  text,
  action,
}: {
  icon: string;
  title: string;
  text?: string;
  action?: { label: string; onPress: () => void; icon?: string };
}) {
  const { c } = useTheme();
  return (
    <View style={{ alignItems: 'center', paddingVertical: spacing.xl, paddingHorizontal: spacing.lg, gap: spacing.sm }}>
      <View
        style={{
          width: 64,
          height: 64,
          borderRadius: 32,
          backgroundColor: c.primarySoft,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: spacing.xs,
        }}
      >
        <Icon name={icon} size={30} color={c.primary} />
      </View>
      <Txt variant="heading" style={{ textAlign: 'center' }}>
        {title}
      </Txt>
      {text ? (
        <Txt tone="muted" style={{ textAlign: 'center' }}>
          {text}
        </Txt>
      ) : null}
      {action ? (
        <Button label={action.label} icon={action.icon} onPress={action.onPress} style={{ marginTop: spacing.sm }} />
      ) : null}
    </View>
  );
}

export function IconCircle({ icon, size = 44, tone = 'primary' }: { icon: string; size?: number; tone?: 'primary' | 'accent' | 'neutral' }) {
  const { c } = useTheme();
  const bg = tone === 'primary' ? c.primarySoft : tone === 'accent' ? c.accentSoft : c.surfaceAlt;
  const fg = tone === 'primary' ? c.primary : tone === 'accent' ? c.accent : c.textMuted;
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: bg,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Icon name={icon} size={size * 0.5} color={fg} />
    </View>
  );
}

export function Divider() {
  const { c } = useTheme();
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: c.border }} />;
}

export function Bullets({ items, icon = 'circle-small', tone }: { items: string[]; icon?: string; tone?: TextTone }) {
  const { c } = useTheme();
  return (
    <View style={{ gap: spacing.sm }}>
      {items.map((item, i) => (
        <View key={i} style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' }}>
          <Icon name={icon} size={18} color={tone === 'warning' ? c.warning : c.primary} style={{ marginTop: 2 }} />
          <Txt style={{ flex: 1 }} tone={tone === 'warning' ? 'default' : tone}>
            {item}
          </Txt>
        </View>
      ))}
    </View>
  );
}

export function Stepper({
  value,
  onChange,
  step,
  min,
  max,
  format,
  label,
}: {
  value: number;
  onChange: (v: number) => void;
  step: number;
  min: number;
  max: number;
  format?: (v: number) => string;
  label: string;
}) {
  const { c } = useTheme();
  const round = (v: number) => Math.round(v * 100) / 100;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
      <IconButton
        icon="minus"
        label={`Diminuir ${label}`}
        onPress={() => onChange(Math.max(min, round(value - step)))}
        disabled={value <= min}
      />
      <View
        style={{
          minWidth: 72,
          paddingVertical: 6,
          paddingHorizontal: spacing.sm,
          borderRadius: radius.sm,
          backgroundColor: c.surfaceAlt,
          alignItems: 'center',
        }}
        accessibilityLabel={`${label}: ${format ? format(value) : value}`}
      >
        <Txt variant="bodyStrong">{format ? format(value) : String(value)}</Txt>
      </View>
      <IconButton
        icon="plus"
        label={`Aumentar ${label}`}
        onPress={() => onChange(Math.min(max, round(value + step)))}
        disabled={value >= max}
      />
    </View>
  );
}
