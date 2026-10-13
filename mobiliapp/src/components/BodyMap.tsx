import { View } from 'react-native';
import Svg, { Circle, Ellipse, G, Rect } from 'react-native-svg';

import { REGIONS } from '../data/taxonomy';
import type { RegionId } from '../data/types';
import { spacing, useTheme } from '../theme';
import { Chip, Row } from './ui';

interface Props {
  value: RegionId | null;
  onChange: (region: RegionId | null) => void;
  height?: number;
}

/**
 * Mapa corporal simplificado (vista frontal) para escolher a região.
 * As regiões também aparecem como chips abaixo, para acessibilidade.
 */
export function BodyMap({ value, onChange, height = 300 }: Props) {
  const { c } = useTheme();
  const whole = value === 'corpo_inteiro';

  const fillFor = (region: RegionId) => {
    if (whole) return c.primary;
    return value === region ? c.primary : c.bodyFill;
  };
  const toggle = (region: RegionId) => onChange(value === region ? null : region);

  const regionProps = (region: RegionId) => ({
    fill: fillFor(region),
    fillOpacity: whole ? 0.55 : 1,
    stroke: c.bodyStroke,
    strokeWidth: 1.5,
    onPress: () => toggle(region),
  });
  const neutral = { fill: whole ? c.primary : c.bodyFill, fillOpacity: whole ? 0.35 : 1, stroke: c.bodyStroke, strokeWidth: 1.5 };

  return (
    <View style={{ gap: spacing.md }}>
      <View style={{ alignItems: 'center' }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Svg width={(height * 200) / 370} height={height} viewBox="0 0 200 370">
          {/* Cabeça */}
          <Circle cx={100} cy={32} r={22} {...neutral} />
          {/* Braços */}
          <Rect x={40} y={88} width={18} height={62} rx={9} {...neutral} />
          <Rect x={142} y={88} width={18} height={62} rx={9} {...neutral} />
          <Rect x={36} y={146} width={16} height={56} rx={8} {...neutral} />
          <Rect x={148} y={146} width={16} height={56} rx={8} {...neutral} />
          {/* Pernas */}
          <Rect x={68} y={262} width={26} height={84} rx={12} {...neutral} />
          <Rect x={106} y={262} width={26} height={84} rx={12} {...neutral} />

          <G {...regionProps('cervical')}>
            <Rect x={90} y={52} width={20} height={20} rx={7} />
          </G>
          <G {...regionProps('toracica')}>
            <Rect x={62} y={70} width={76} height={62} rx={18} />
          </G>
          <G {...regionProps('lombar')}>
            <Rect x={66} y={126} width={68} height={48} rx={14} />
          </G>
          <G {...regionProps('quadril')}>
            <Rect x={66} y={196} width={30} height={70} rx={13} />
            <Rect x={104} y={196} width={30} height={70} rx={13} />
            <Rect x={64} y={168} width={72} height={42} rx={16} />
          </G>
          <G {...regionProps('ombro')}>
            <Circle cx={60} cy={84} r={15} />
            <Circle cx={140} cy={84} r={15} />
          </G>
          <G {...regionProps('punho')}>
            <Circle cx={44} cy={210} r={10} />
            <Circle cx={156} cy={210} r={10} />
          </G>
          <G {...regionProps('tornozelo')}>
            <Ellipse cx={81} cy={352} rx={17} ry={10} />
            <Ellipse cx={119} cy={352} rx={17} ry={10} />
          </G>
        </Svg>
      </View>
      <Row wrap style={{ justifyContent: 'center' }}>
        {REGIONS.map((r) => (
          <Chip key={r.id} small label={r.curto} selected={value === r.id} onPress={() => toggle(r.id)} />
        ))}
      </Row>
    </View>
  );
}
