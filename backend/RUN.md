# 백엔드 실행 가이드

## Windows PowerShell에서 실행

### 1. .env 파일 설정

1. `backend/.env.example` 파일을 복사하여 `.env`로 이름 변경:
   ```powershell
   cd backend
   Copy-Item .env.example .env
   ```

2. `.env` 파일을 열어서 실제 값으로 수정:
   ```env
   GOOGLE_CLIENT_ID=실제-Client-ID.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=실제-Client-Secret
   JWT_SECRET=실제-JWT-Secret-최소-32자
   DB_PASSWORD=실제-비밀번호
   ```

**중요**: `.env` 파일은 Git에 커밋되지 않습니다 (`.gitignore`에 포함됨)

### 2. 환경 변수 로드 및 백엔드 실행

**방법 1: run.ps1 스크립트 사용 (권장, 가장 간단)**

```powershell
cd backend
# .env 파일에서 환경 변수 로드 후 백엔드 자동 실행
.\run.ps1
```

**방법 2: load-env.ps1 + 수동 실행**

```powershell
cd backend
# .env 파일에서 환경 변수 로드
.\load-env.ps1

# 백엔드 실행 (같은 셸에서 실행해야 환경 변수가 유지됨)
.\gradlew.bat bootRun
```

**방법 2: 수동으로 환경 변수 설정**

```powershell
cd backend
# .env 파일 내용을 읽어서 환경 변수로 설정
Get-Content .env | ForEach-Object {
    if ($_ -match '^\s*([^=]+)=(.*)$' -and $_ -notmatch '^\s*#') {
        $key = $matches[1].Trim()
        $value = $matches[2].Trim() -replace '^["'']|["'']$', ''
        [Environment]::SetEnvironmentVariable($key, $value, "Process")
    }
}

# 백엔드 실행
.\gradlew.bat bootRun
```

**방법 3: 직접 환경 변수 설정**

```powershell
$env:GOOGLE_CLIENT_ID="여기에-발급받은-Client-ID-입력"
$env:GOOGLE_CLIENT_SECRET="여기에-발급받은-Client-Secret-입력"
$env:JWT_SECRET="여기에-JWT-Secret-입력-최소-32자"
.\gradlew.bat bootRun
```

**방법 2: 직접 gradle 명령어 사용 (Gradle이 설치된 경우)**
```powershell
cd backend
gradle bootRun
```

### 3. 확인

브라우저에서 다음 URL 접속:
```
http://localhost:8080/api/health
```

또는 Google 로그인 테스트:
```
http://localhost:8080/api/auth/google/login
```

## 문제 해결

### "gradlew.bat을 찾을 수 없습니다"
- `backend` 디렉토리에 `gradlew.bat` 파일이 있는지 확인
- 없다면 Gradle Wrapper를 생성해야 합니다

### "JAVA_HOME이 설정되지 않았습니다"
- Java 17 이상이 설치되어 있는지 확인
- JAVA_HOME 환경 변수 설정 필요

### "포트 8080이 이미 사용 중입니다"
- 다른 애플리케이션이 8080 포트를 사용 중일 수 있습니다
- `application.yml`에서 포트 변경 가능
