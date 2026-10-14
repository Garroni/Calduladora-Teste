import * as Linking from 'expo-linking';
import { router, useLocalSearchParams } from 'expo-router';
import { Share, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { Button, Card, EmptyState, Icon, Row, Screen, Txt } from '../../components/ui';
import { buildShareUrl, encodeSequence } from '../../domain/share';
import { useAppStore } from '../../store/useAppStore';
import { radius, spacing, useTheme } from '../../theme';

export default function ShareScreen() {
  const { c } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const rotina = useAppStore((s) => s.rotinas.find((r) => r.id === id));
  const modoPro = useAppStore((s) => s.modoPro);
  const nomeProfissional = useAppStore((s) => s.nomeProfissional);
  const track = useAppStore((s) => s.track);

  if (!rotina) {
    return (
      <Screen>
        <EmptyState icon="bookmark-remove-outline" title="Rotina não encontrada" action={{ label: 'Voltar', onPress: () => router.back() }} />
      </Screen>
    );
  }

  const autor = rotina.autor || (modoPro && nomeProfissional ? nomeProfissional : undefined);
  const url = buildShareUrl(Linking.createURL('importar'), encodeSequence({ ...rotina, autor }));

  const share = async () => {
    try {
      await Share.share({
        title: rotina.nome,
        message: `${autor ? `${autor} enviou uma rotina de mobilidade` : 'Rotina de mobilidade'}: "${rotina.nome}". Abra no MobiliApp: ${url}`,
      });
      track('rotina_compartilhada', { itens: rotina.itens.length, meio: 'link' });
    } catch {
      // Usuário cancelou ou o sistema não permite compartilhar.
    }
  };

  return (
    <Screen>
      <View style={{ alignItems: 'center', gap: spacing.sm }}>
        <Txt variant="title" style={{ textAlign: 'center' }}>
          {rotina.nome}
        </Txt>
        <Txt tone="muted" style={{ textAlign: 'center' }}>
          O aluno aponta a câmera para o código ou abre o link no celular com o MobiliApp instalado.
        </Txt>
      </View>

      <View style={{ alignSelf: 'center', padding: spacing.lg, backgroundColor: '#FFFFFF', borderRadius: radius.lg }}>
        <QRCode value={url} size={220} color="#11221C" backgroundColor="#FFFFFF" ecl="M" />
      </View>

      <Button icon="share-variant" label="Enviar link" onPress={share} />

      <Card>
        <Txt variant="label" tone="muted">
          LINK
        </Txt>
        <Txt selectable variant="caption">
          {url}
        </Txt>
      </Card>

      {modoPro && !nomeProfissional ? (
        <Card onPress={() => router.push('/ajustes')} style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'center' }}>
          <Icon name="account-edit-outline" size={22} color={c.primary} />
          <Txt variant="caption" style={{ flex: 1 }}>
            Defina seu nome profissional em Ajustes para que o aluno saiba quem enviou a rotina.
          </Txt>
        </Card>
      ) : null}

      <Row style={{ alignItems: 'flex-start' }}>
        <Icon name="lock-outline" size={16} color={c.textMuted} />
        <Txt variant="caption" tone="muted" style={{ flex: 1 }}>
          O link contém apenas o nome da rotina, os exercícios, os tempos e as observações. Nenhum dado pessoal ou avaliação é enviado.
        </Txt>
      </Row>
    </Screen>
  );
}
