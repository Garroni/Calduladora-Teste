#!/usr/bin/env bash
# Verifica/instala dependências das skills de vídeo e animação.
#   --check            mostra o que falta (padrão)
#   --install <skill>  instala as dependências de uma skill
#   --update           baixa de novo as skills dos repositórios originais
set -euo pipefail

SKILLS_DIR="$(cd "$(dirname "$0")/.." && pwd)"
MODE="${1:---check}"

have() { command -v "$1" >/dev/null 2>&1; }
status() { if have "$1"; then echo "  ok      $1"; else echo "  FALTA   $1  ($2)"; fi; }

check() {
  echo "Ferramentas:"
  status node    "take-one, huashu-motion, explainroo, argo"
  status npx     "explainroo, huashu-motion"
  status ffmpeg  "todas as que renderizam MP4"
  status uv      "huashu-art-motion, earshot"
  status bun     "reanimate"
  status python3 "video-director, real-sound"
  status earshot "uv tool install \"earshot[mcp] @ git+https://github.com/Leonxlnx/earshot\""
}

install() {
  case "${1:-}" in
    earshot|real-sound)
      uv tool install "earshot[mcp] @ git+https://github.com/Leonxlnx/earshot"
      echo "Modelos (~1,1 GB) baixam no primeiro uso, ou agora com: earshot doctor --fetch" ;;
    explainroo)
      ONNXRUNTIME_NODE_INSTALL_CUDA=skip npx --yes explainroo doctor ;;
    argo-guide|argo)
      npm i -D @argo-video/cli
      echo "TTS local gratuito (~410 MB): npm i kokoro-js@1" ;;
    huashu-motion)
      npx --yes huashu-motion doctor ;;
    huashu-art-motion)
      uv run --with playwright playwright install chromium ;;
    video-director)
      python3 -m pip install numpy Pillow ;;
    take-one)
      bash "$SKILLS_DIR/take-one/scripts/doctor.sh" ;;
    reanimate|rossark-motion-skill)
      echo "Sem instalação prévia: reanimate baixa ffmpeg/Chromium no primeiro uso (precisa de Bun);"
      echo "rossark usa react-native-svg + Reanimated ou SwiftUI no próprio projeto." ;;
    *) echo "Uso: $0 --install <skill>"; exit 1 ;;
  esac
}

update() {
  tmp="$(mktemp -d)"
  trap 'rm -rf "$tmp"' EXIT
  fetch() { git clone -q --depth 1 "https://github.com/$1.git" "$tmp/$(basename "$1")"; }
  copy() {
    rm -rf "$2"; mkdir -p "$2"
    (cd "$1" && tar --exclude=.git --exclude=.github --exclude='*.mp4' --exclude='*.mov' \
      --exclude='*.webm' --exclude='*.gif' --exclude=node_modules --exclude=./assets/showcase -cf - .) \
      | (cd "$2" && tar -xf -)
  }
  for r in alchaincyf/huashu-art-motion alchaincyf/huashu-motion Leonxlnx/earshot NiazMorshed2007/reanimate \
           vincentsch/explainroo rossark0/rossark-motion-skill win4r/video-director talsiach/take-one shreyaskarnik/argo; do
    fetch "$r"
  done
  copy "$tmp/huashu-art-motion"                   "$SKILLS_DIR/huashu-art-motion"
  copy "$tmp/huashu-motion/skills/huashu-motion"  "$SKILLS_DIR/huashu-motion"
  copy "$tmp/earshot/skills/earshot"              "$SKILLS_DIR/earshot"
  copy "$tmp/earshot/skills/real-sound"           "$SKILLS_DIR/real-sound"
  copy "$tmp/reanimate/skills/reanimate"          "$SKILLS_DIR/reanimate"
  copy "$tmp/explainroo/skills/explainroo"        "$SKILLS_DIR/explainroo"
  copy "$tmp/rossark-motion-skill"                "$SKILLS_DIR/rossark-motion-skill"
  copy "$tmp/video-director/video-director"       "$SKILLS_DIR/video-director"
  copy "$tmp/take-one"                            "$SKILLS_DIR/take-one"
  copy "$tmp/argo/skills/argo-guide"              "$SKILLS_DIR/argo-guide"
  echo "Skills atualizadas em $SKILLS_DIR"
}

case "$MODE" in
  --check) check ;;
  --install) install "${2:-}" ;;
  --update) update ;;
  *) echo "Uso: $0 [--check | --install <skill> | --update]"; exit 1 ;;
esac
