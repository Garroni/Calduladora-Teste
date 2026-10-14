import { useMemo } from 'react';
import { useColorScheme } from 'react-native';

export interface Palette {
  bg: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  text: string;
  textMuted: string;
  primary: string;
  primaryText: string;
  primarySoft: string;
  primarySoftText: string;
  accent: string;
  accentSoft: string;
  warning: string;
  warningSoft: string;
  success: string;
  successSoft: string;
  danger: string;
  dangerSoft: string;
  overlay: string;
  bodyFill: string;
  bodyStroke: string;
}

const light: Palette = {
  bg: '#F5F4EF',
  surface: '#FFFFFF',
  surfaceAlt: '#ECEAE2',
  border: '#E0DDD3',
  text: '#18221F',
  textMuted: '#5B6762',
  primary: '#11705A',
  primaryText: '#FFFFFF',
  primarySoft: '#DCEFE7',
  primarySoftText: '#0B4F3F',
  accent: '#D9663B',
  accentSoft: '#F9E3D8',
  warning: '#9A6400',
  warningSoft: '#FBEFD5',
  success: '#1D7A3E',
  successSoft: '#DDF1E2',
  danger: '#B3261E',
  dangerSoft: '#F9DEDC',
  overlay: 'rgba(12, 20, 17, 0.45)',
  bodyFill: '#E4E1D7',
  bodyStroke: '#CBC7BA',
};

const dark: Palette = {
  bg: '#0E1412',
  surface: '#171F1C',
  surfaceAlt: '#212B27',
  border: '#2B3632',
  text: '#ECF1EE',
  textMuted: '#9DAAA4',
  primary: '#4CC3A0',
  primaryText: '#062A20',
  primarySoft: '#173A30',
  primarySoftText: '#A8E6D2',
  accent: '#F08A5D',
  accentSoft: '#3D2419',
  warning: '#E8B04B',
  warningSoft: '#33280F',
  success: '#6BCB8B',
  successSoft: '#163223',
  danger: '#F2867E',
  dangerSoft: '#3A1A18',
  overlay: 'rgba(0, 0, 0, 0.6)',
  bodyFill: '#26312D',
  bodyStroke: '#3A4743',
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const radius = { sm: 8, md: 12, lg: 18, pill: 999 } as const;

export const type = {
  display: { fontSize: 30, lineHeight: 36, fontWeight: '800' as const, letterSpacing: -0.5 },
  title: { fontSize: 22, lineHeight: 28, fontWeight: '700' as const, letterSpacing: -0.2 },
  heading: { fontSize: 17, lineHeight: 22, fontWeight: '700' as const },
  body: { fontSize: 15, lineHeight: 21, fontWeight: '400' as const },
  bodyStrong: { fontSize: 15, lineHeight: 21, fontWeight: '600' as const },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '400' as const },
  label: { fontSize: 12, lineHeight: 16, fontWeight: '700' as const, letterSpacing: 0.4 },
};

export interface Theme {
  dark: boolean;
  c: Palette;
}

export function useTheme(): Theme {
  const scheme = useColorScheme();
  return useMemo(() => ({ dark: scheme === 'dark', c: scheme === 'dark' ? dark : light }), [scheme]);
}

/** Cria estilos dependentes do tema, recalculados apenas quando o tema muda. */
export function makeStyles<T>(factory: (t: Theme) => T): () => T {
  return function useStyles() {
    const theme = useTheme();
    return useMemo(() => factory(theme), [theme]);
  };
}
