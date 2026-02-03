#!/usr/bin/env bash
# 프로젝트 루트에서 실행: ./scripts/check.sh
# 프론트엔드·백엔드 린트·타입체크·테스트를 한 번에 실행 (CI와 동일한 검사)

set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "=== Markdown Viewer V2 - 통합 검사 ==="
echo ""

echo "[1/2] Frontend: install, lint, type-check, test"
cd frontend
npm ci 2>/dev/null || npm install
npm run lint
npm run type-check
npm run test:run
echo "Frontend OK"
echo ""

echo "[2/2] Backend: test"
cd "$ROOT/backend"
chmod +x gradlew 2>/dev/null || true
./gradlew test --no-daemon
echo "Backend OK"
echo ""

echo "=== 모든 검사 통과 ==="
