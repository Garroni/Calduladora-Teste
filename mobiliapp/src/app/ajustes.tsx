import Constants from 'expo-constants';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Alert, Platform, Pressable, Switch, TextInput, View } from 'react-native';

import { Card, Chip, Divider, Icon, Row, Screen, Section, Txt } from '../components/ui';
import { DIFFICULTY_LABEL } from '../data/taxonomy';
import type { Difficulty } from '../data/types';
import { useAppStore } from '../store/useAppStore';
import { radius, spacing, useTheme } from '../theme';

function LinkRow({ icon, label, detail, onPress, danger }: { icon: string; label: string; detail?: string; onPress: () => void; danger?: boolean }) {
  const { c } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm, opacity: pressed ? 0.7 : 1 })}
    >
      <Icon name={icon} size={22} color={danger ? c.danger : c.primary} />
      <View style={{ flex: 1 }}>
        <Txt tone={danger ? 'danger' : 'default'}>{label}</Txt>
        {detail ? (
          <Txt variant="caption" tone="muted">
            {detail}
          </Txt>
        ) : null}
      </View>
      {!danger ? <Icon name="chevron-right" size={20} color={c.textMuted} /> : null}
    </Pressable>
  );
}

function Group({ children }: { children: ReactNode }) {
  return <Card style={{ paddingVertical: spacing.sm, gap: 0 }}>{children}</Card>;
}

export default function SettingsScreen() {
  const { c } = useTheme();
  const kit = useAppStore((s) => s.kit);
  const nivel = useAppStore((s) => s.nivel);
  const setNivel = useAppStore((s) => s.setNivel);
  const modoPro = useAppStore((s) => s.modoPro);
  const setModoPro = useAppStore((s) => s.setModoPro);
  const nomeProfissional = useAppStore((s) => s.nomeProfissional);
  const setNomeProfissional = useAppStore((s) => s.setNomeProfissional);
  const validacaoAtiva = useAppStore((s) => s.validacaoAtiva);
  const resetTudo = useAppStore((s) => s.resetTudo);

  const apagar = () => {
    const doReset = () => {
      resetTudo();
      router.replace('/onboarding');
    };
    if (Platform.OS === 'web') {
      doReset();
      return;
    }
    Alert.alert('Apagar todos os dados?', 'Kit, rotinas, avaliações e métricas deste aparelho serão apagados.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Apagar', style: 'destructive', onPress: doReset },
    ]);
  };

  return (
    <Screen>
      <Section title="Perfil">
        <Group>
          <LinkRow icon="bag-personal-outline" label="Meu kit" detail={kit.length ? `${kit.length} equipamentos` : 'Só peso corporal'} onPress={() => router.push('/equipamentos')} />
        </Group>
        <View style={{ gap: spacing.sm }}>
          <Txt variant="label" tone="muted">
            NÍVEL
          </Txt>
          <Row wrap>
            {([1, 2, 3] as Difficulty[]).map((d) => (
              <Chip key={d} label={DIFFICULTY_LABEL[d]} selected={nivel === d} onPress={() => setNivel(d)} />
            ))}
          </Row>
          <Txt variant="caption" tone="muted">
            O montador só usa exercícios até o seu nível.
          </Txt>
        </View>
      </Section>

      <Section title="Modo profissional" subtitle="Para personal trainers e professores de Pilates.">
        <Card>
          <Row style={{ justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              <Txt variant="bodyStrong">Ativar modo profissional</Txt>
              <Txt variant="caption" tone="muted">
                Modelos de rotina, observações para o aluno e envio por link ou QR code.
              </Txt>
            </View>
            <Switch value={modoPro} onValueChange={setModoPro} trackColor={{ true: c.primary, false: c.border }} accessibilityLabel="Ativar modo profissional" />
          </Row>
          {modoPro ? (
            <View style={{ gap: 4, marginTop: spacing.sm }}>
              <Txt variant="label" tone="muted">
                NOME EXIBIDO PARA O ALUNO
              </Txt>
              <TextInput
                value={nomeProfissional}
                onChangeText={setNomeProfissional}
                placeholder="Ex.: Profa. Ana Souza"
                placeholderTextColor={c.textMuted}
                maxLength={60}
                accessibilityLabel="Nome profissional"
                style={{ borderWidth: 1, borderColor: c.border, borderRadius: radius.md, padding: spacing.md, color: c.text, fontSize: 15 }}
              />
            </View>
          ) : null}
        </Card>
      </Section>

      <Section title="Validação do produto">
        <Group>
          <LinkRow
            icon="clipboard-text-outline"
            label="Teste com usuários"
            detail={validacaoAtiva ? 'Registrando métricas neste aparelho' : 'Desativado'}
            onPress={() => router.push('/validacao')}
          />
        </Group>
      </Section>

      <Section title="Sobre">
        <Group>
          <LinkRow icon="shield-check-outline" label="Sobre e segurança" onPress={() => router.push('/sobre')} />
          <Divider />
          <LinkRow icon="restart" label="Rever introdução" onPress={() => router.push('/onboarding')} />
          <Divider />
          <LinkRow icon="delete-outline" label="Apagar todos os dados" onPress={apagar} danger />
        </Group>
        <Txt variant="caption" tone="muted" style={{ textAlign: 'center' }}>
          MobiliApp {Constants.expoConfig?.version ?? ''} · protótipo para validação
        </Txt>
      </Section>
    </Screen>
  );
}
