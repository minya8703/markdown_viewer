# 프로젝트 루트에서 실행: .\scripts\run-dev.ps1
# 백엔드(.env 로드 + bootRun)와 프론트엔드(dev 서버)를 동시에 실행

$ErrorActionPreference = 'Stop'
$root = (Get-Item $PSScriptRoot).Parent.FullName

$backendDir = Join-Path $root "backend"
$frontendDir = Join-Path $root "frontend"
$envPath = Join-Path $backendDir ".env"

if (-not (Test-Path $envPath)) {
    Write-Host "백엔드 .env 파일이 없습니다. backend\.env.example을 복사해 backend\.env를 만드세요." -ForegroundColor Red
    exit 1
}

Write-Host "=== Markdown Viewer V2 - 개발 서버 (백엔드 + 프론트) ===" -ForegroundColor Cyan
Write-Host "백엔드: http://localhost:8080  |  프론트: http://localhost:5173" -ForegroundColor Gray
Write-Host "종료: 이 창에서 Ctrl+C (프론트만 종료). 백엔드는 새 창에서 Ctrl+C" -ForegroundColor Gray
Write-Host ""

# 백엔드: 새 PowerShell 창에서 실행
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendDir'; .\run.ps1"

Start-Sleep -Seconds 2

# 프론트엔드: 현재 창에서 실행 (Ctrl+C로 종료)
Push-Location $frontendDir
try {
    npm run dev
} finally {
    Pop-Location
}
