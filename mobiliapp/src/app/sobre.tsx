import { View } from 'react-native';

import { ReviewBadge } from '../components/exercise';
import { Bullets, Card, Screen, Section, Txt } from '../components/ui';
import { EXERCISES } from '../data/exercises';
import { REVIEW_LABEL } from '../data/taxonomy';
import type { ReviewStatus } from '../data/types';
import { spacing } from '../theme';

export default function AboutScreen() {
  const counts = EXERCISES.reduce<Record<ReviewStatus, number>>(
    (acc, e) => ({ ...acc, [e.revisao.status]: acc[e.revisao.status] + 1 }),
    { revisado: 0, em_revisao: 0, pendente: 0 },
  );

  return (
    <Screen>
      <View style={{ gap: spacing.sm }}>
        <Txt variant="title">MobiliApp</Txt>
        <Txt tone="muted">
          Encontre o movimento certo com o que você tem. O app combina equipamento disponível, região do corpo, objetivo e tempo
          para sugerir exercícios de mobilidade e montar sequências, sem que você precise saber o nome técnico de cada exercício.
        </Txt>
      </View>

      <Section title="Segurança">
        <Card>
          <Bullets
            icon="shield-check-outline"
            items={[
              'O MobiliApp não faz diagnóstico, não trata lesões e não substitui avaliação de fisioterapeuta, médico ou profissional de educação física.',
              'Movimente-se dentro de uma amplitude confortável. Desconforto leve é esperado; dor aguda, não.',
              'Interrompa e procure orientação se sentir dor forte, tontura, falta de ar, formigamento ou perda de força.',
              'Em caso de cirurgia recente, gestação, osteoporose, hipertensão não controlada ou lesão em tratamento, peça liberação profissional antes.',
              'Leia os "Cuidados e limitações" de cada exercício.',
            ]}
          />
        </Card>
      </Section>

      <Section title="Revisão técnica do catálogo" subtitle="Cada exercício mostra a situação da sua revisão.">
        <Card style={{ gap: spacing.md }}>
          {(Object.keys(REVIEW_LABEL) as ReviewStatus[]).map((s) => (
            <View key={s} style={{ gap: 4 }}>
              <ReviewBadge status={s} />
              <Txt variant="caption" tone="muted">
                {REVIEW_LABEL[s].descricao} ({counts[s]} {counts[s] === 1 ? 'exercício' : 'exercícios'})
              </Txt>
            </View>
          ))}
        </Card>
        <Txt variant="caption" tone="muted">
          Esta é uma versão de protótipo: as instruções foram redigidas para validação e precisam ser revisadas por profissional
          habilitado antes de serem publicadas ao público.
        </Txt>
      </Section>

      <Section title="Progressão de mobilidade">
        <Txt tone="muted">
          As avaliações seguem protocolos simples e padronizados. Elas servem para comparar você com você mesmo ao longo do tempo,
          em condições semelhantes, e não para indicar diagnóstico.
        </Txt>
      </Section>

      <Section title="Demonstrações">
        <Txt tone="muted">
          Os vídeos e as animações serão produzidos pela equipe ou licenciados com uso comercial confirmado. Até lá, cada exercício
          traz instruções passo a passo.
        </Txt>
      </Section>

      <Section title="Privacidade">
        <Txt tone="muted">
          Kit, rotinas, avaliações e métricas ficam salvos apenas neste aparelho. Links de rotina contêm só os exercícios, os tempos e
          as observações da rotina.
        </Txt>
      </Section>
    </Screen>
  );
}
