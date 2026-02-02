# .env 파일을 읽어서 환경 변수로 설정하고 백엔드를 실행하는 스크립트
# 사용법: .\run.ps1

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
    
    # 환경 변수 확인
    Write-Host "Verifying environment variables..." -ForegroundColor Yellow
    $clientId = [Environment]::GetEnvironmentVariable("GOOGLE_CLIENT_ID", "Process")
    $clientSecret = [Environment]::GetEnvironmentVariable("GOOGLE_CLIENT_SECRET", "Process")
    
    if ([string]::IsNullOrEmpty($clientId) -or $clientId -match "여기에|your-google-client-id") {
        Write-Host "WARNING: GOOGLE_CLIENT_ID is not set or using default value!" -ForegroundColor Red
        Write-Host "Please check your .env file." -ForegroundColor Yellow
        exit 1
    }
    
    if ([string]::IsNullOrEmpty($clientSecret) -or $clientSecret -match "여기에|your-google-client-secret") {
        Write-Host "WARNING: GOOGLE_CLIENT_SECRET is not set or using default value!" -ForegroundColor Red
        Write-Host "Please check your .env file." -ForegroundColor Yellow
        exit 1
    }
    
    Write-Host "Environment variables verified." -ForegroundColor Green
    Write-Host ""
    Write-Host "Starting backend server..." -ForegroundColor Cyan
    Write-Host ""
    
    # 백엔드 실행
    & ".\gradlew.bat" bootRun
} else {
    Write-Host "Error: .env file not found at $envFile" -ForegroundColor Red
    Write-Host "Please create .env file from .env.example" -ForegroundColor Yellow
    exit 1
}
