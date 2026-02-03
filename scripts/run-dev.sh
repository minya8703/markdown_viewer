#!/usr/bin/env bash
# 프로젝트 루트에서 실행: ./scripts/run-dev.sh
# 백엔드와 프론트엔드 dev 서버를 동시에 실행 (백그라운드 + 포그라운드)

set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND="$ROOT/backend"
FRONTEND="$ROOT/frontend"

if [ ! -f "$BACKEND/.env" ]; then
  echo "백엔드 .env 파일이 없습니다. backend/.env.example을 복사해 backend/.env를 만드세요."
  exit 1
fi

echo "=== Markdown Viewer V2 - 개발 서버 (백엔드 + 프론트) ==="
echo "백엔드: http://localhost:8080  |  프론트: http://localhost:5173"
echo ""

# .env 로드 후 백엔드 실행 (백그라운드)
export $(grep -v '^#' "$BACKEND/.env" | xargs)
cd "$BACKEND"
./gradlew bootRun &
BACKEND_PID=$!
cd "$ROOT"

# 프론트엔드 (포그라운드)
cd "$FRONTEND"
npm run dev &
FRONT_PID=$!

cleanup() {
  kill $BACKEND_PID $FRONT_PID 2>/dev/null || true
  exit 0
}
trap cleanup SIGINT SIGTERM
wait
