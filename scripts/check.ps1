# 프로젝트 루트에서 실행: .\scripts\check.ps1
# 프론트엔드·백엔드 린트·타입체크·테스트를 한 번에 실행 (CI와 동일한 검사)

$ErrorActionPreference = 'Stop'
$root = (Get-Item $PSScriptRoot).Parent.FullName

Write-Host "=== Markdown Viewer V2 - 통합 검사 ===" -ForegroundColor Cyan
Write-Host ""

# Frontend
Write-Host "[1/2] Frontend: install, lint, type-check, test" -ForegroundColor Yellow
Push-Location (Join-Path $root "frontend")
try {
    # npm ci 시 Windows에서 EPERM 나올 수 있음. install 실패해도 스크립트 중단하지 않도록 Continue 사용
    $prevErrAction = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    npm ci 2>$null
    if ($LASTEXITCODE -ne 0) { npm install 2>$null }
    $ErrorActionPreference = $prevErrAction
    if ($LASTEXITCODE -ne 0) {
        Write-Host "경고: npm install 실패. node_modules가 이미 있으면 lint/test만 진행합니다. EPERM 시: 다른 터미널/IDE에서 frontend 폴더 닫고 재시도하거나, 관리자 권한으로 실행하세요." -ForegroundColor Yellow
    }
    npm run lint
    if ($LASTEXITCODE -ne 0) { throw "Lint failed" }
    npm run type-check
    if ($LASTEXITCODE -ne 0) { throw "Type-check failed" }
    npm run test:run
    if ($LASTEXITCODE -ne 0) { throw "Tests failed" }
    Write-Host "Frontend OK" -ForegroundColor Green
} finally {
    Pop-Location
}
Write-Host ""

# Backend
Write-Host "[2/2] Backend: test" -ForegroundColor Yellow
Push-Location (Join-Path $root "backend")
try {
    if ($IsWindows -or $env:OS -match "Windows") {
        & ".\gradlew.bat" test --no-daemon
    } else {
        ./gradlew test --no-daemon
    }
    if ($LASTEXITCODE -ne 0) { throw "Backend tests failed" }
    Write-Host "Backend OK" -ForegroundColor Green
} finally {
    Pop-Location
}

Write-Host ""
Write-Host "=== 모든 검사 통과 ===" -ForegroundColor Green
