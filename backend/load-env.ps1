# .env 파일을 읽어서 환경 변수로 설정하는 PowerShell 스크립트
# 사용법: .\load-env.ps1

$envFile = Join-Path $PSScriptRoot ".env"

if (Test-Path $envFile) {
    Write-Host "Loading environment variables from .env file..." -ForegroundColor Green
    
    Get-Content $envFile | ForEach-Object {
        # 주석과 빈 줄 건너뛰기
        if ($_ -match '^\s*#|^\s*$') {
            return
        }
        
        # KEY=VALUE 형식 파싱
        if ($_ -match '^\s*([^=]+)=(.*)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            
            # 따옴표 제거 (있는 경우)
            $value = $value -replace '^["'']|["'']$', ''
            
            # 환경 변수 설정
            [Environment]::SetEnvironmentVariable($key, $value, "Process")
            Write-Host "  $key = ***" -ForegroundColor Gray
        }
    }
    
    Write-Host "Environment variables loaded successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "To verify, run:" -ForegroundColor Yellow
    Write-Host "  echo `$env:GOOGLE_CLIENT_ID" -ForegroundColor Yellow
} else {
    Write-Host "Error: .env file not found at $envFile" -ForegroundColor Red
    Write-Host "Please create .env file from .env.example" -ForegroundColor Yellow
    exit 1
}
