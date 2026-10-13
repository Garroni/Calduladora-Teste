import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EquipmentPicker } from '../components/exercise';
import { Button, Chip, Icon, IconCircle, Row, Txt } from '../components/ui';
import { EXERCISES } from '../data/exercises';
import { DIFFICULTY_LABEL } from '../data/taxonomy';
import type { Difficulty } from '../data/types';
import { isCompatible } from '../domain/catalog';
import { useAppStore } from '../store/useAppStore';
import { radius, spacing, useTheme } from '../theme';

const PILLARS = [
  { icon: 'bag-personal-outline', title: 'Equipamento', text: 'Marque o que você tem: bola, rolo, elástico, bastão, parede…' },
  { icon: 'human', title: 'Região', text: 'Quadril, ombros, coluna torácica, tornozelos ou corpo inteiro.' },
  { icon: 'target', title: 'Objetivo', text: 'Preparar o treino, ganhar amplitude ou controle e estabilidade.' },
  { icon: 'timer-outline', title: 'Tempo', text: '5, 10 ou 15 minutos, com cronômetro e transições.' },
];

const DIFFICULTY_HINT: Record<Difficulty, string> = {
  1: 'Estou começando ou voltando agora.',
  2: 'Já pratico com alguma regularidade.',
  3: 'Treino com frequência e conheço os movimentos.',
};

export default function OnboardingScreen() {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  const kit = useAppStore((s) => s.kit);
  const toggleEquip = useAppStore((s) => s.toggleEquip);
  const nivel = useAppStore((s) => s.nivel);
  const setNivel = useAppStore((s) => s.setNivel);
  const modoPro = useAppStore((s) => s.modoPro);
  const setModoPro = useAppStore((s) => s.setModoPro);
  const concluir = useAppStore((s) => s.concluirOnboarding);

  const available = EXERCISES.filter((e) => isCompatible(e, kit)).length;

  const finish = () => {
    concluir();
    router.replace('/');
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.bg, paddingTop: insets.top, paddingBottom: insets.bottom + spacing.md }}>
      <Row style={{ justifyContent: 'center', paddingVertical: spacing.md }} gap={6}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={{ width: i === step ? 24 : 8, height: 8, borderRadius: 4, backgroundColor: i === step ? c.primary : c.border }} />
        ))}
      </Row>

      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}>
        {step === 0 ? (
          <>
            <View style={{ gap: spacing.md, paddingTop: spacing.lg }}>
              <IconCircle icon="yoga" size={72} />
              <Txt variant="label" tone="primary">
                MOBILIAPP
              </Txt>
              <Txt variant="display">Encontre o movimento certo com o que você tem.</Txt>
              <Txt tone="muted">Você não precisa saber o nome técnico do exercício. Responda quatro coisas:</Txt>
            </View>
            <View style={{ gap: spacing.md }}>
              {PILLARS.map((p, i) => (
                <Row key={p.title} style={{ alignItems: 'flex-start' }} gap={spacing.md}>
                  <View style={{ width: 40, height: 40, borderRadius: radius.md, backgroundColor: c.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name={p.icon} size={22} color={c.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Txt variant="bodyStrong">
                      {i + 1}. {p.title}
                    </Txt>
                    <Txt variant="caption" tone="muted">
                      {p.text}
                    </Txt>
                  </View>
                </Row>
              ))}
            </View>
          </>
        ) : null}

        {step === 1 ? (
          <>
            <View style={{ gap: spacing.sm }}>
              <Txt variant="title">O que você tem em casa ou na academia?</Txt>
              <Txt tone="muted">Sem nada? Tudo bem: há exercícios só com o peso do corpo. Você pode mudar depois.</Txt>
            </View>
            <EquipmentPicker selected={kit} onToggle={toggleEquip} />
          </>
        ) : null}

        {step === 2 ? (
          <>
            <View style={{ gap: spacing.sm }}>
              <Txt variant="title">Como você se descreve?</Txt>
              <Txt tone="muted">Usamos o nível para sugerir exercícios adequados.</Txt>
            </View>
            <View style={{ gap: spacing.sm }}>
              {([1, 2, 3] as Difficulty[]).map((d) => (
                <Chip key={d} label={`${DIFFICULTY_LABEL[d]} — ${DIFFICULTY_HINT[d]}`} selected={nivel === d} onPress={() => setNivel(d)} />
              ))}
            </View>
            <View style={{ gap: spacing.sm }}>
              <Txt variant="heading">Você é personal trainer ou professor(a) de Pilates?</Txt>
              <Row wrap>
                <Chip icon="account-tie" label="Sim, sou profissional" selected={modoPro} onPress={() => setModoPro(true)} />
                <Chip icon="account" label="Não, vou praticar" selected={!modoPro} onPress={() => setModoPro(false)} />
              </Row>
              {modoPro ? (
                <Txt variant="caption" tone="muted">
                  Você poderá montar modelos e enviar rotinas para alunos por link ou QR code.
                </Txt>
              ) : null}
            </View>
            <View style={{ flexDirection: 'row', gap: spacing.sm, padding: spacing.md, borderRadius: radius.md, backgroundColor: c.warningSoft }}>
              <Icon name="shield-alert-outline" size={18} color={c.warning} />
              <Txt variant="caption" style={{ flex: 1 }}>
                O MobiliApp não faz diagnóstico nem substitui orientação profissional. Os exercícios deste protótipo ainda passam por
                validação técnica. Movimente-se sem dor.
              </Txt>
            </View>
          </>
        ) : null}
      </ScrollView>

      <View style={{ paddingHorizontal: spacing.lg, gap: spacing.sm }}>
        {step === 1 ? (
          <Txt variant="caption" tone="muted" style={{ textAlign: 'center' }}>
            {available} exercícios disponíveis com o que você marcou
          </Txt>
        ) : null}
        <Row>
          {step > 0 ? <Button variant="ghost" label="Voltar" onPress={() => setStep(step - 1)} style={{ flex: 1 }} /> : null}
          <Button
            label={step === 2 ? 'Começar' : 'Continuar'}
            icon={step === 2 ? 'check' : 'arrow-right'}
            onPress={() => (step === 2 ? finish() : setStep(step + 1))}
            style={{ flex: 2 }}
          />
        </Row>
      </View>
    </View>
  );
}
