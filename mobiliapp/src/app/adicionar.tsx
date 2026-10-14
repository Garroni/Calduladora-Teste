import { router } from 'expo-router';
import { useState } from 'react';
import { Switch, TextInput, View } from 'react-native';

import { ExerciseCard } from '../components/exercise';
import { Icon, Row, Screen, Txt } from '../components/ui';
import type { Exercise } from '../data/types';
import { filterExercises } from '../domain/catalog';
import { clampWork } from '../domain/sequence';
import { makeSequence, useAppStore } from '../store/useAppStore';
import { radius, spacing, useTheme } from '../theme';

export default function AddExerciseScreen() {
  const { c } = useTheme();
  const kit = useAppStore((s) => s.kit);
  const rascunho = useAppStore((s) => s.rascunho);
  const setRascunho = useAppStore((s) => s.setRascunho);
  const setRascunhoItens = useAppStore((s) => s.setRascunhoItens);
  const [busca, setBusca] = useState('');
  const [soKit, setSoKit] = useState(true);

  const results = filterExercises({ busca, somenteCompativeis: soKit }, kit);
  const inSequence = new Set(rascunho?.itens.map((i) => i.exerciseId) ?? []);

  const add = (ex: Exercise) => {
    const item = { exerciseId: ex.id, trabalhoSeg: clampWork(ex.duracaoSeg) };
    if (rascunho) setRascunhoItens([...rascunho.itens, item]);
    else setRascunho(makeSequence({ nome: 'Nova rotina', itens: [item], origem: 'manual' }));
    router.back();
  };

  return (
    <Screen>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          backgroundColor: c.surface,
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor: c.border,
          paddingHorizontal: spacing.md,
        }}
      >
        <Icon name="magnify" size={20} color={c.textMuted} />
        <TextInput
          value={busca}
          onChangeText={setBusca}
          placeholder="Buscar por nome, região ou músculo"
          placeholderTextColor={c.textMuted}
          accessibilityLabel="Buscar exercício para adicionar"
          style={{ flex: 1, paddingVertical: 12, fontSize: 15, color: c.text }}
        />
      </View>
      <Row style={{ justifyContent: 'space-between' }}>
        <Txt>Só com o meu kit</Txt>
        <Switch value={soKit} onValueChange={setSoKit} trackColor={{ true: c.primary, false: c.border }} accessibilityLabel="Só com o meu kit" />
      </Row>
      <View style={{ gap: spacing.sm }}>
        {results.map((ex) => (
          <ExerciseCard
            key={ex.id}
            exercise={ex}
            kit={kit}
            onPress={() => add(ex)}
            right={
              <Icon
                name={inSequence.has(ex.id) ? 'check-circle' : 'plus-circle'}
                size={26}
                color={inSequence.has(ex.id) ? c.textMuted : c.primary}
              />
            }
          />
        ))}
      </View>
    </Screen>
  );
}
