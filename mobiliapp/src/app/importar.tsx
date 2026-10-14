import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { TextInput, View } from 'react-native';

import { SequenceItemRow } from '../components/sequence';
import { Badge, Button, Card, Icon, Row, Screen, Txt } from '../components/ui';
import { EXERCISE_BY_ID } from '../data/exercises';
import { OBJECTIVE_BY_ID } from '../data/taxonomy';
import { isCompatible } from '../domain/catalog';
import { adaptToKit, sequenceSeconds } from '../domain/sequence';
import { decodeSequence, parseQueryString } from '../domain/share';
import { formatDuration } from '../domain/text';
import { makeSequence, useAppStore } from '../store/useAppStore';
import { radius, spacing, useTheme } from '../theme';

export default function ImportScreen() {
  const { c } = useTheme();
  const params = useLocalSearchParams<Record<string, string>>();
  const kit = useAppStore((s) => s.kit);
  const nivel = useAppStore((s) => s.nivel);
  const salvarRotina = useAppStore((s) => s.salvarRotina);
  const setRascunho = useAppStore((s) => s.setRascunho);
  const track = useAppStore((s) => s.track);

  const [texto, setTexto] = useState('');
  const [manual, setManual] = useState<Record<string, string> | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const decoded = useMemo(() => decodeSequence(manual ?? params), [manual, params]);
  const tracked = useRef(false);
  useEffect(() => {
    if (decoded && !tracked.current) {
      tracked.current = true;
      track('rotina_importada', { itens: decoded.itens.length });
    }
  }, [decoded, track]);

  const abrir = () => {
    const parsed = parseQueryString(texto);
    if (!decodeSequence(parsed)) {
      setErro('Não reconhecemos esse link. Confira se ele foi copiado por inteiro.');
      return;
    }
    setErro(null);
    setManual(parsed);
  };

  if (!decoded) {
    return (
      <Screen>
        <View style={{ alignItems: 'center', gap: spacing.sm, paddingTop: spacing.lg }}>
          <Icon name="qrcode-scan" size={48} color={c.primary} />
          <Txt variant="title" style={{ textAlign: 'center' }}>
            Abrir rotina recebida
          </Txt>
          <Txt tone="muted" style={{ textAlign: 'center' }}>
            Aponte a câmera do celular para o QR code do profissional, ou cole aqui o link que você recebeu.
          </Txt>
        </View>
        <TextInput
          value={texto}
          onChangeText={setTexto}
          placeholder="Cole o link da rotina"
          placeholderTextColor={c.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          multiline
          accessibilityLabel="Link da rotina"
          style={{
            minHeight: 90,
            padding: spacing.md,
            borderRadius: radius.md,
            borderWidth: 1,
            borderColor: erro ? c.danger : c.border,
            backgroundColor: c.surface,
            color: c.text,
            fontSize: 14,
            textAlignVertical: 'top',
          }}
        />
        {erro ? <Txt tone="danger">{erro}</Txt> : null}
        <Button icon="download" label="Abrir rotina" disabled={!texto.trim()} onPress={abrir} />
      </Screen>
    );
  }

  const incompativeis = decoded.itens.filter((i) => !isCompatible(EXERCISE_BY_ID[i.exerciseId], kit)).length;
  const base = makeSequence({
    nome: decoded.nome,
    itens: decoded.itens,
    origem: 'importada',
    objetivo: decoded.objetivo,
    regiao: decoded.regiao,
    notas: decoded.notas,
    autor: decoded.autor,
  });

  const salvar = () => {
    salvarRotina(base);
    router.replace(`/rotinas/${base.id}`);
  };
  const comecar = () => {
    setRascunho(base);
    router.replace({ pathname: '/player', params: { id: 'rascunho' } });
  };
  const adaptar = () => {
    const result = adaptToKit(decoded.itens, kit, nivel);
    const avisos = result.trocas.map((t) => `Trocamos "${EXERCISE_BY_ID[t.de].nome}" por "${EXERCISE_BY_ID[t.para].nome}", que usa o que você tem.`);
    setRascunho(
      { ...base, nome: `${decoded.nome} (adaptada)`, itens: result.itens },
      { avisos },
    );
    router.replace('/sequencia');
  };

  return (
    <Screen>
      <View style={{ gap: spacing.sm }}>
        {decoded.autor ? (
          <Row gap={6}>
            <Icon name="account-tie" size={18} color={c.primary} />
            <Txt variant="caption" tone="primary" style={{ fontWeight: '700' }}>
              Enviada por {decoded.autor}
            </Txt>
          </Row>
        ) : null}
        <Txt variant="title">{decoded.nome}</Txt>
        <Row wrap gap={6}>
          <Badge tone="primary" icon="timer-outline" label={formatDuration(sequenceSeconds(decoded.itens))} />
          <Badge label={`${decoded.itens.length} exercícios`} />
          {decoded.objetivo ? <Badge label={OBJECTIVE_BY_ID[decoded.objetivo].nome} /> : null}
        </Row>
      </View>

      {decoded.notas ? (
        <Card>
          <Txt variant="label" tone="muted">
            OBSERVAÇÕES
          </Txt>
          <Txt>{decoded.notas}</Txt>
        </Card>
      ) : null}

      {decoded.desconhecidos.length > 0 ? (
        <View style={{ padding: spacing.md, borderRadius: radius.md, backgroundColor: c.warningSoft }}>
          <Txt variant="caption">
            {decoded.desconhecidos.length} exercício(s) desta rotina não existem nesta versão do app e foram ignorados. Atualize o MobiliApp para ver a rotina completa.
          </Txt>
        </View>
      ) : null}

      {incompativeis > 0 ? (
        <View style={{ padding: spacing.lg, borderRadius: radius.lg, backgroundColor: c.accentSoft, gap: spacing.sm }}>
          <Txt variant="bodyStrong">
            {incompativeis === 1 ? '1 exercício usa' : `${incompativeis} exercícios usam`} acessórios que você não marcou.
          </Txt>
          <Button small variant="accent" icon="auto-fix" label="Adaptar ao meu kit" onPress={adaptar} />
        </View>
      ) : null}

      <View style={{ gap: spacing.sm }}>
        {decoded.itens.map((item, i) => (
          <SequenceItemRow key={`${item.exerciseId}-${i}`} index={i} item={item} kit={kit} />
        ))}
      </View>

      <Button icon="play" label="Começar agora" onPress={comecar} />
      <Button variant="secondary" icon="content-save-outline" label="Salvar nas minhas rotinas" onPress={salvar} />
    </Screen>
  );
}
