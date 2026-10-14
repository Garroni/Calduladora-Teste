import { router } from 'expo-router';

import { EquipmentPicker } from '../components/exercise';
import { Button, Card, Row, Screen, Txt } from '../components/ui';
import { EXERCISES } from '../data/exercises';
import { EQUIPMENT_BY_ID } from '../data/taxonomy';
import { isCompatible, unlockSuggestions } from '../domain/catalog';
import { useAppStore } from '../store/useAppStore';
import { spacing } from '../theme';

export default function EquipmentScreen() {
  const kit = useAppStore((s) => s.kit);
  const toggleEquip = useAppStore((s) => s.toggleEquip);
  const available = EXERCISES.filter((e) => isCompatible(e, kit)).length;
  const suggestions = unlockSuggestions(kit).slice(0, 3);

  return (
    <Screen>
      <Txt tone="muted">
        Marque o que você tem em casa ou na academia. Os exercícios e sequências passam a usar só esses acessórios, e o app sugere
        alternativas quando faltar algum.
      </Txt>

      <Card style={{ padding: spacing.md }}>
        <Txt variant="bodyStrong">
          {available} de {EXERCISES.length} exercícios disponíveis
        </Txt>
        <Txt variant="caption" tone="muted">
          Exercícios só com o peso do corpo estão sempre disponíveis.
        </Txt>
        {suggestions.length > 0 ? (
          <Row wrap gap={4}>
            <Txt variant="caption" tone="muted">
              Mais liberam:
            </Txt>
            <Txt variant="caption" tone="accent">
              {suggestions.map((s) => `${EQUIPMENT_BY_ID[s.equip].nome} (+${s.libera})`).join(' · ')}
            </Txt>
          </Row>
        ) : null}
      </Card>

      <EquipmentPicker selected={kit} onToggle={toggleEquip} />

      <Button icon="check" label="Pronto" onPress={() => router.back()} />
    </Screen>
  );
}
