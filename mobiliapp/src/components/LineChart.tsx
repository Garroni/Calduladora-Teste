import { View } from 'react-native';
import Svg, { Circle, Line, Polyline, Text as SvgText } from 'react-native-svg';

import { useTheme } from '../theme';
import { Row, Txt } from './ui';

export interface ChartSeries {
  label: string;
  values: number[];
  color: string;
}

/** Gráfico de linha simples para o histórico de avaliações. */
export function LineChart({
  series,
  width,
  height = 160,
  formatY = (v: number) => String(v),
}: {
  series: ChartSeries[];
  width: number;
  height?: number;
  formatY?: (v: number) => string;
}) {
  const { c } = useTheme();
  const all = series.flatMap((s) => s.values);
  const count = Math.max(...series.map((s) => s.values.length));
  if (all.length === 0 || count === 0) return null;

  const padL = 36;
  const padR = 12;
  const padT = 12;
  const padB = 20;
  let min = Math.min(...all);
  let max = Math.max(...all);
  if (min === max) {
    min -= 1;
    max += 1;
  }
  const x = (i: number) => (count === 1 ? padL + (width - padL - padR) / 2 : padL + (i * (width - padL - padR)) / (count - 1));
  const y = (v: number) => padT + ((max - v) * (height - padT - padB)) / (max - min);

  return (
    <View style={{ gap: 6 }}>
      <Svg width={width} height={height} accessibilityLabel="Gráfico do histórico de avaliações">
        {[min, (min + max) / 2, max].map((v, i) => (
          <Line key={i} x1={padL} x2={width - padR} y1={y(v)} y2={y(v)} stroke={c.border} strokeWidth={1} strokeDasharray="3 4" />
        ))}
        {[min, max].map((v, i) => (
          <SvgText key={i} x={padL - 6} y={y(v) + 4} fontSize={10} fill={c.textMuted} textAnchor="end">
            {formatY(Math.round(v * 10) / 10)}
          </SvgText>
        ))}
        {series.map((s) => (
          <Polyline
            key={s.label}
            points={s.values.map((v, i) => `${x(i)},${y(v)}`).join(' ')}
            fill="none"
            stroke={s.color}
            strokeWidth={2.5}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ))}
        {series.map((s) =>
          s.values.map((v, i) => (
            <Circle key={`${s.label}-${i}`} cx={x(i)} cy={y(v)} r={4} fill={c.surface} stroke={s.color} strokeWidth={2} />
          )),
        )}
      </Svg>
      {series.length > 1 ? (
        <Row style={{ justifyContent: 'center', gap: 16 }}>
          {series.map((s) => (
            <Row key={s.label} gap={6}>
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: s.color }} />
              <Txt variant="caption" tone="muted">
                {s.label}
              </Txt>
            </Row>
          ))}
        </Row>
      ) : null}
    </View>
  );
}
