import { Redirect, router } from 'expo-router';
import { Pressable, View } from 'react-native';

import { KitSummary, PageHeader, SafetyNote } from '../../components/layout';
import { Card, Chip, Icon, IconButton, Row, Screen, Section, Txt } from '../../components/ui';
import { EQUIPMENT_BY_ID, OBJECTIVES, REGIONS } from '../../data/taxonomy';
import { unlockSuggestions } from '../../domain/catalog';
import { sequenceSeconds } from '../../domain/sequence';
import { formatDuration } from '../../domain/text';
import { useAppStore } from '../../store/useAppStore';
import { radius, spacing, useTheme } from '../../theme';

export default function HomeScreen() {
  const { c } = useTheme();
  const onboarded = useAppStore((s) => s.onboarded);
  const kit = useAppStore((s) => s.kit);
  const rotinas = useAppStore((s) => s.rotinas);
  const modoPro = useAppStore((s) => s.modoPro);

  if (!onboarded) return <Redirect href="/onboarding" />;

  const suggestion = unlockSuggestions(kit)[0];

  return (
    <Screen safeTop>
      <PageHeader
        eyebrow="MobiliApp"
        title="Encontre o movimento certo com o que você tem."
        right={<IconButton icon="cog-outline" label="Ajustes" onPress={() => router.push('/ajustes')} />}
      />

      <KitSummary kit={kit} />

      <Pressable
        onPress={() => router.push('/montar')}
        accessibilityRole="button"
        accessibilityLabel="Montar uma sequência"
        style={({ pressed }) => ({
          backgroundColor: c.primary,
          borderRadius: radius.lg,
          padding: spacing.lg,
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.md,
          opacity: pressed ? 0.92 : 1,
          overflow: 'hidden',
        })}
      >
        <View
          style={{
            position: 'absolute',
            right: -30,
            top: -30,
            width: 140,
            height: 140,
            borderRadius: 70,
            backgroundColor: c.primaryText,
            opacity: 0.08,
          }}
        />
        <View style={{ flex: 1, gap: 4 }}>
          <Txt variant="heading" tone="inverse">
            Montar uma sequência
          </Txt>
          <Txt variant="caption" tone="inverse" style={{ opacity: 0.9 }}>
            Região, objetivo e tempo: 5, 10 ou 15 minutos com cronômetro e transições.
          </Txt>
        </View>
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: c.primaryText,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="play" size={24} color={c.primary} />
        </View>
      </Pressable>

      <Section title="Qual é o seu objetivo?" subtitle="Escolha uma situação real de treino.">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {OBJECTIVES.map((o) => (
            <Pressable
              key={o.id}
              onPress={() => router.push({ pathname: '/explorar', params: { objetivo: o.id } })}
              accessibilityRole="button"
              accessibilityLabel={o.nome}
              style={({ pressed }) => ({
                flexBasis: '47%',
                flexGrow: 1,
                minHeight: 92,
                padding: spacing.md,
                borderRadius: radius.md,
                backgroundColor: c.surface,
                borderWidth: 1,
                borderColor: c.border,
                gap: spacing.sm,
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <Icon name={o.icone} size={24} color={c.primary} />
              <Txt variant="bodyStrong" style={{ fontSize: 14 }}>
                {o.nome}
              </Txt>
            </Pressable>
          ))}
        </View>
      </Section>

      <Section title="Por região do corpo" action={{ label: 'Mapa corporal', onPress: () => router.push({ pathname: '/explorar', params: { mapa: '1' } }) }}>
        <Row wrap>
          {REGIONS.map((r) => (
            <Chip
              key={r.id}
              label={r.curto}
              onPress={() => router.push({ pathname: '/explorar', params: { regiao: r.id } })}
            />
          ))}
        </Row>
      </Section>

      {rotinas.length > 0 ? (
        <Section title="Suas rotinas" action={{ label: 'Ver todas', onPress: () => router.push('/rotinas') }}>
          {rotinas.slice(0, 3).map((r) => (
            <Card key={r.id} onPress={() => router.push(`/rotinas/${r.id}`)} style={{ padding: spacing.md }}>
              <Row style={{ justifyContent: 'space-between' }}>
                <View style={{ flex: 1, gap: 2 }}>
                  <Txt variant="bodyStrong" numberOfLines={1}>
                    {r.nome}
                  </Txt>
                  <Txt variant="caption" tone="muted">
                    {r.itens.length} exercícios · {formatDuration(sequenceSeconds(r.itens))}
                  </Txt>
                </View>
                <Icon name="chevron-right" size={22} color={c.textMuted} />
              </Row>
            </Card>
          ))}
        </Section>
      ) : null}

      {suggestion ? (
        <Card onPress={() => router.push('/equipamentos')} style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'center' }}>
          <Icon name={EQUIPMENT_BY_ID[suggestion.equip].icone} size={28} color={c.accent} />
          <View style={{ flex: 1 }}>
            <Txt variant="bodyStrong">
              Tem {EQUIPMENT_BY_ID[suggestion.equip].nome.toLowerCase()}?
            </Txt>
            <Txt variant="caption" tone="muted">
              Marcar no seu kit libera mais {suggestion.libera} {suggestion.libera === 1 ? 'exercício' : 'exercícios'}.
            </Txt>
          </View>
          <Icon name="plus-circle-outline" size={24} color={c.accent} />
        </Card>
      ) : null}

      {!modoPro ? (
        <Card onPress={() => router.push('/ajustes')} style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'center' }}>
          <Icon name="account-tie" size={28} color={c.primary} />
          <View style={{ flex: 1 }}>
            <Txt variant="bodyStrong">É personal ou professor(a) de Pilates?</Txt>
            <Txt variant="caption" tone="muted">
              Ative o modo profissional para montar modelos e enviar rotinas por link ou QR code.
            </Txt>
          </View>
        </Card>
      ) : null}

      <SafetyNote />
    </Screen>
  );
}
