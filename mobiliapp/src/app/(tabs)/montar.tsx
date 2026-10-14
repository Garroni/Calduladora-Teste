import { router } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { BodyMap } from '../../components/BodyMap';
import { KitSummary, PageHeader } from '../../components/layout';
import { Button, Card, Chip, Icon, Row, Screen, Section, Stepper, Txt } from '../../components/ui';
import { DIFFICULTY_LABEL, OBJECTIVES, OBJECTIVE_BY_ID, REGION_BY_ID } from '../../data/taxonomy';
import type { Difficulty, ObjectiveId, RegionId } from '../../data/types';
import { buildSequence } from '../../domain/sequence';
import { makeSequence, useAppStore } from '../../store/useAppStore';
import { radius, spacing, useTheme } from '../../theme';

const QUICK_TIMES = [5, 10, 15];

function Step({ n, title, children, hint }: { n: number; title: string; hint?: string; children: ReactNode }) {
  const { c } = useTheme();
  return (
    <View style={{ gap: spacing.md }}>
      <Row gap={spacing.sm}>
        <View
          style={{
            width: 26,
            height: 26,
            borderRadius: 13,
            backgroundColor: c.primarySoft,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Txt variant="caption" style={{ color: c.primarySoftText, fontWeight: '800' }}>
            {n}
          </Txt>
        </View>
        <View style={{ flex: 1 }}>
          <Txt variant="heading">{title}</Txt>
          {hint ? (
            <Txt variant="caption" tone="muted">
              {hint}
            </Txt>
          ) : null}
        </View>
      </Row>
      {children}
    </View>
  );
}

export default function BuilderScreen() {
  const { c } = useTheme();
  const kit = useAppStore((s) => s.kit);
  const nivel = useAppStore((s) => s.nivel);
  const setNivel = useAppStore((s) => s.setNivel);
  const setRascunho = useAppStore((s) => s.setRascunho);
  const rascunho = useAppStore((s) => s.rascunho);
  const track = useAppStore((s) => s.track);

  const [regiao, setRegiao] = useState<RegionId | null>(null);
  const [objetivo, setObjetivo] = useState<ObjectiveId>('pre_treino');
  const [minutos, setMinutos] = useState(10);

  const gerar = () => {
    const seed = Date.now() % 100000;
    const out = buildSequence({ kit, objetivo, regiao, minutos, nivel, seed });
    setRascunho(
      makeSequence({
        nome: out.nome,
        itens: out.itens,
        origem: 'gerada',
        objetivo,
        regiao: regiao ?? undefined,
        tempoAlvoMin: minutos,
      }),
      { avisos: out.avisos, seed, minutos },
    );
    track('sequencia_gerada', { objetivo, regiao: regiao ?? 'nenhuma', minutos, itens: out.itens.length });
    router.push('/sequencia');
  };

  const comecarDoZero = () => {
    setRascunho(makeSequence({ nome: 'Nova rotina', itens: [], origem: 'manual' }));
    router.push('/sequencia');
  };

  const objetivoInfo = OBJECTIVE_BY_ID[objetivo];

  return (
    <Screen safeTop>
      <PageHeader
        title="Montar sequência"
        subtitle="Combine o que você tem, a região, o objetivo e o tempo disponível. O app organiza a ordem e as transições."
      />

      {rascunho && rascunho.itens.length > 0 ? (
        <Card onPress={() => router.push('/sequencia')} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          <Icon name="playlist-edit" size={24} color={c.primary} />
          <View style={{ flex: 1 }}>
            <Txt variant="caption" tone="muted">
              Continuar editando
            </Txt>
            <Txt variant="bodyStrong" numberOfLines={1}>
              {rascunho.nome}
            </Txt>
          </View>
          <Icon name="chevron-right" size={22} color={c.textMuted} />
        </Card>
      ) : null}

      <Step n={1} title="Equipamentos">
        <KitSummary kit={kit} max={4} />
      </Step>

      <Step n={2} title="Região do corpo" hint="Opcional. Sem região, o app usa as regiões mais importantes para o objetivo.">
        <Card>
          <BodyMap value={regiao} onChange={setRegiao} height={240} />
        </Card>
      </Step>

      <Step n={3} title="Objetivo">
        <View style={{ gap: spacing.sm }}>
          {OBJECTIVES.map((o) => {
            const on = objetivo === o.id;
            return (
              <Pressable
                key={o.id}
                onPress={() => setObjetivo(o.id)}
                accessibilityRole="radio"
                accessibilityState={{ selected: on }}
                accessibilityLabel={o.nome}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.md,
                  padding: spacing.md,
                  borderRadius: radius.md,
                  borderWidth: 1.5,
                  borderColor: on ? c.primary : c.border,
                  backgroundColor: on ? c.primarySoft : c.surface,
                  opacity: pressed ? 0.85 : 1,
                })}
              >
                <Icon name={o.icone} size={22} color={on ? c.primary : c.textMuted} />
                <View style={{ flex: 1 }}>
                  <Txt variant="bodyStrong" style={on ? { color: c.primarySoftText } : undefined}>
                    {o.nome}
                  </Txt>
                  {on ? (
                    <Txt variant="caption" tone="muted">
                      {o.descricao}
                    </Txt>
                  ) : null}
                </View>
                <Icon name={on ? 'radiobox-marked' : 'radiobox-blank'} size={22} color={on ? c.primary : c.border} />
              </Pressable>
            );
          })}
        </View>
      </Step>

      <Step n={4} title="Tempo disponível">
        <Row wrap>
          {QUICK_TIMES.map((t) => (
            <Chip key={t} icon="timer-outline" label={`${t} min`} selected={minutos === t} onPress={() => setMinutos(t)} />
          ))}
        </Row>
        <Row style={{ justifyContent: 'space-between' }}>
          <Txt tone="muted">Ou ajuste:</Txt>
          <Stepper value={minutos} onChange={setMinutos} step={1} min={3} max={30} format={(v) => `${v} min`} label="tempo" />
        </Row>
      </Step>

      <Section title="Nível">
        <Row wrap>
          {([1, 2, 3] as Difficulty[]).map((d) => (
            <Chip key={d} label={DIFFICULTY_LABEL[d]} selected={nivel === d} onPress={() => setNivel(d)} />
          ))}
        </Row>
      </Section>

      <Card style={{ backgroundColor: c.surfaceAlt, borderWidth: 0 }}>
        <Txt variant="caption" tone="muted">
          Sua sequência
        </Txt>
        <Txt variant="bodyStrong">
          {regiao && regiao !== 'corpo_inteiro' ? `${REGION_BY_ID[regiao].nome} · ` : ''}
          {objetivoInfo.nome} · {minutos} min
        </Txt>
        <Txt variant="caption" tone="muted">
          Ordem pensada por finalidade: soltar, mover, alongar, controlar e integrar, sem repetir o mesmo tipo de exercício.
        </Txt>
      </Card>

      <Button icon="auto-fix" label="Gerar sequência" onPress={gerar} />
      <Button variant="ghost" icon="playlist-plus" label="Montar do zero, exercício por exercício" onPress={comecarDoZero} />
    </Screen>
  );
}
