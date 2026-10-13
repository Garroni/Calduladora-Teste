# MobiliApp

> **Encontre o movimento certo com o que você tem.**

Aplicativo de mobilidade para **iOS e Android** (Expo / React Native, um único código), construído a partir do documento
*MobiliApp — Diferenciação, biblioteca e validação*. O usuário marca os equipamentos que tem, escolhe região, objetivo e
tempo, e recebe exercícios compatíveis, alternativas de acessório e sequências cronometradas.

## O que o app faz

| Seção do documento | Onde está no app |
|---|---|
| 2.1 Filtro por equipamento disponível | **Meu kit** (introdução e Ajustes) + chave **"Só com o meu kit"** no Explorar |
| 2.2 Substituição inteligente de acessórios | Tela do exercício (**"Sem bastão?"**), troca no editor de sequência e **"Adaptar ao meu kit"** em rotinas recebidas |
| 2.3 Mobilidade por objetivo | 8 objetivos (agachamento, ombros acima da cabeça, corrida, quadril, torácica, controle, amplitude, pré-treino) |
| 2.4 Montador de sequências | Aba **Montar**: região (mapa corporal) + objetivo + tempo (5/10/15 min ou personalizado) → editor → player com cronômetro, troca de lado e transições |
| 2.5 Modo profissional | Ajustes → modo profissional: modelos, observações para o aluno e envio por **link ou QR code** |
| 2.6 Progressão de mobilidade | Aba **Progresso**: 4 protocolos padronizados, histórico com gráfico e comparação só entre medições feitas em condições semelhantes |
| 3. Diferencial (equipamento + região + objetivo + tempo) | Fluxo da introdução e da aba Montar |
| 4. Biblioteca e metadados | 54 exercícios em 7 categorias, com todas as etiquetas pedidas, inclusive a **situação da revisão técnica** |
| 5. Validação gastando pouco | Ajustes → **Teste com usuários**: métricas locais (tempo até encontrar, filtros usados, sequências montadas), questionário e exportação em JSON |

### Como o montador respeita a finalidade dos exercícios

A sequência não é uma soma aleatória de movimentos (`src/domain/sequence.ts`):

1. Cada objetivo tem um **perfil de fases**: liberação → mobilidade → alongamento → controle → integração. Por exemplo, a
   preparação para treino não inclui alongamento estático sustentado.
2. Os exercícios são escolhidos por fase, priorizando o objetivo e cobrindo as regiões-alvo (agachamento: tornozelo, quadril e torácica).
3. Nunca entram dois exercícios da mesma **família funcional**.
4. Os tempos são ajustados para ocupar o tempo escolhido, já contando transições (10 s) e trocas de lado (5 s).
5. Se faltar opção com o kit atual, o app avisa o que fez (por exemplo: "sem bola ou rolo, o tempo de liberação foi redistribuído").

### Substituição sem trocas inadequadas

Cada exercício pertence a uma família (ex.: `dorsiflexao` = joelho na parede, dorsiflexão com faixa, dorsiflexão em
semiajoelhado). Só exercícios da mesma família aparecem como **substitutos**. Os de mesma região mas com outra finalidade
aparecem separados, como "outras opções", e o app deixa claro que não são substitutos diretos.

## Rodar no celular (sem Xcode nem Android Studio)

```bash
cd mobiliapp
npm install
npx expo start
```

Instale o app **Expo Go** (App Store / Google Play) e leia o QR code que aparece no terminal. Todas as bibliotecas usadas
estão incluídas no Expo Go.

Também roda no navegador: `npx expo start --web`.

## Publicar nas lojas (EAS)

```bash
npx eas-cli@latest login
npx eas-cli@latest build --platform android --profile preview      # APK para testar
npx eas-cli@latest build --platform all --profile production       # AAB (Play) e IPA (App Store)
npx eas-cli@latest submit --platform all
```

Antes de publicar, ajuste `ios.bundleIdentifier` e `android.package` em `app.json` (hoje `com.mobiliapp.app`) e troque
os ícones em `assets/`. Publicar na App Store exige conta Apple Developer; na Play Store, conta Google Play Console.

## Desenvolvimento

```bash
npm test             # testes de domínio (catálogo, substituição, montador, links, avaliações, métricas)
npm run typecheck    # TypeScript
npm run lint         # ESLint (configuração do Expo)
```

```
src/
  app/          telas (Expo Router): (tabs)/, exercicio/[id], sequencia, player, rotinas/[id],
                compartilhar/[id], importar, avaliacao/[id], equipamentos, ajustes, validacao, sobre, onboarding
  components/   interface (cartões, mapa corporal, gráfico, editor de sequência…)
  data/         catálogo de exercícios, taxonomia (equipamentos, regiões, objetivos) e protocolos de avaliação
  domain/       regras puras e testadas: filtros, substituição, montador, links, progresso, métricas
  store/        estado salvo no aparelho (zustand + AsyncStorage)
```

## Antes de abrir ao público

- **Revisão técnica.** Todos os exercícios estão marcados como `pendente` ("Aguardando validação técnica"): o texto é de
  protótipo. Depois que um profissional habilitado revisar, preencha `revisao` em `src/data/exercises.ts`:
  ```ts
  revisao: { status: 'revisado', revisor: 'Nome', registroProfissional: 'CREFITO/CREF …', data: '2026-11-01' }
  ```
  O selo, o filtro "Somente revisados" e a tela Sobre passam a refletir isso automaticamente.
- **Vídeos.** Cada exercício tem o campo `videoUrl`. Hoje aparece "Vídeo demonstrativo em produção". Use conteúdo próprio ou
  com licença comercial confirmada.
- **Links de rotina.** Usam o esquema `mobiliapp://importar?...`. Para links `https://` que abrem o app ou a loja, configure
  um domínio com *universal links* (iOS) e *app links* (Android).
- **Dados.** Tudo fica salvo apenas no aparelho, sem conta nem servidor. Sincronização e planos pagos para profissionais
  ficam para depois da validação, como o documento recomenda.
