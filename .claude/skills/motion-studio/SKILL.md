---
name: motion-studio
description: Ponto de entrada para qualquer pedido de vídeo, animação ou som feito em código. Escolhe e encadeia a skill certa entre as instaladas (video-director, take-one, huashu-motion, huashu-art-motion, explainroo, argo-guide, reanimate, rossark-motion-skill, earshot, real-sound, e os plugins remotion). Use quando o usuário pedir vídeo de lançamento, explicativo, demo de produto, motion graphics, animar ilustração/SVG/mascote, clonar uma animação de um site ou vídeo, trilha sonora, efeitos sonoros ou revisão de áudio — mesmo em pedidos de uma linha como "faz um vídeo de 15s do meu app".
---

# motion-studio — roteador de vídeo, animação e som

Esta skill não renderiza nada sozinha. Ela decide **qual skill especializada carregar** (via a ferramenta Skill), em que ordem, e o que cada uma entrega. Leia a tabela, escolha, anuncie a escolha ao usuário em uma linha e carregue a skill escolhida.

## 1. Tabela de roteamento

| O usuário quer… | Skill principal | Saída | Requisitos |
|---|---|---|---|
| Filme curto "de estúdio" a partir de um pedido curto (lançamento, marca, clipe musical), com pitch, storyboard, revisão | `take-one` | MP4 | Node 18+, Chrome, ffmpeg (`scripts/doctor.sh`) |
| Dirigir/planejar/revisar qualquer vídeo em código; checar timeline, ritmo, legibilidade; consertar vídeo que "parece IA genérica" | `video-director` | plano + MP4/página | Python (numpy, Pillow) |
| Filme de lançamento sincronizado com a batida, motion graphics editáveis no navegador, "aponta no frame e muda" | `huashu-motion` | projeto editável + MP4 | Node; CLI via `npx huashu-motion` |
| Animação artística/narrativa visual, 36 estilos, gramáticas de explicação, vídeo com narração (conteúdo em chinês) | `huashu-art-motion` | MP4 | uv, ffmpeg, Playwright Chromium |
| Vídeo explicativo **narrado**, voz local sem API, legendas/tempo por palavra, shorts (YouTube/Reels/TikTok) | `explainroo` | MP4 | `npx --yes explainroo doctor --fetch` |
| Demo de produto gravada do app real (walkthrough Playwright + voz IA + overlays) | `argo-guide` | MP4 | `npm i -D @argo-video/cli` + TTS (kokoro-js) |
| Clonar/recriar uma animação de um site, gif, vídeo ou Lottie **quadro a quadro** no código do projeto | `reanimate` | código + prova frame a frame | Bun 1.1+ |
| Dar vida a ilustração, SVG, ícone, mascote, cena (respirar, piscar, idle) em React Native / SwiftUI / web | `rossark-motion-skill` | componentes animados | react-native-svg + Reanimated, ou SwiftUI |
| Trilha sonora real (música licenciada, foley, SFX, ambiência), mix, master, créditos, mux | `real-sound` | áudio masterizado + MP4 | ffmpeg, Python |
| Ouvir/julgar áudio (o agente não ouve): escolher SFX, checar sync, loudness, A/B de mix, SFX gerado por código | `earshot` | leituras numéricas | `uv tool install "earshot[mcp] @ git+https://github.com/Leonxlnx/earshot"` |
| Vídeo em React/Remotion, legendas, renderização Remotion | `remotion:remotion-best-practices` (plugin já instalado) | MP4 | Remotion |
| Animação de interface web (GSAP, ScrollTrigger, Reanimated, Skia) | agente `hzblj-skills:animation-specialist` | código | — |

Se dois servem, prefira: **pedido vago → `take-one`**; **pedido técnico/revisão → `video-director`**; **tem narração → `explainroo`**; **é o app rodando → `argo-guide`**.

## 2. Combinações (pipelines)

- **Lançamento completo**: `video-director` (roteiro, storyboard, gates) → `huashu-motion` ou `take-one` (render) → `real-sound` (trilha) → `earshot` (QA de áudio) → `video-director` (revisão final).
- **Explicativo narrado**: `explainroo` (voz + timing por palavra) → `earshot` (checar voz e loudness).
- **Demo de SaaS**: `argo-guide` (gravação + voz) → `real-sound` só se pedirem trilha.
- **"Faz igual a esse site"**: `reanimate` → se for ilustração/personagem para mobile, `rossark-motion-skill`.
- **Áudio em qualquer vídeo**: nunca afirme como algo soa sem uma leitura do `earshot`.

## 3. Regras

1. **Anuncie a rota** antes de começar: "Vou usar `X` (motivo), depois `Y`."
2. **Custos**: nada que gaste dinheiro, créditos de API ou downloads grandes (modelos de 300 MB–1,1 GB) sem perguntar.
3. **Dependências**: antes do primeiro uso numa máquina, rode `bash .claude/skills/motion-studio/setup.sh --check` e instale só o que a rota escolhida precisa (`--install <skill>`).
4. **Entregáveis**: MP4s e renders vão para `videos/` (ou pasta indicada) e não devem ser commitados se forem grandes.
5. **Idioma**: responda ao usuário em português; `huashu-*` tem docs em chinês — leia e traduza o essencial, não peça para o usuário ler.
6. **Licenças**: `huashu-art-motion` tem arte de personagem só para demo; `real-sound` exige checar licença de cada áudio. Respeite.

## 4. Origem das skills

| Skill | Repositório |
|---|---|
| huashu-art-motion | github.com/alchaincyf/huashu-art-motion |
| huashu-motion | github.com/alchaincyf/huashu-motion |
| earshot, real-sound | github.com/Leonxlnx/earshot |
| reanimate | github.com/NiazMorshed2007/reanimate |
| explainroo | github.com/vincentsch/explainroo |
| rossark-motion-skill | github.com/rossark0/rossark-motion-skill |
| video-director | github.com/win4r/video-director |
| take-one | github.com/talsiach/take-one |
| argo-guide | github.com/shreyaskarnik/argo |

Vídeos/GIFs de demonstração dos repositórios foram omitidos na cópia para manter o repo leve. Para atualizar: `bash .claude/skills/motion-studio/setup.sh --update`.
