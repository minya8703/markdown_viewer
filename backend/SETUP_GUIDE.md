# 빠른 설정 가이드

## OAuth 클라이언트 설정 방법

Google OAuth 클라이언트를 생성했다면, 다음 중 하나의 방법으로 설정하세요.

### 방법 1: application.yml 직접 수정 (간단함)

`backend/src/main/resources/application.yml` 파일을 열어서 다음 부분을 수정:

```yaml
spring:
  security:
    oauth2:
      client:
        registration:
          google:
            client-id: 여기에-발급받은-Client-ID-입력
            client-secret: 여기에-발급받은-Client-Secret-입력
```

**예시:**
```yaml
spring:
  security:
    oauth2:
      client:
        registration:
          google:
            client-id: 123456789-abcdefghijklmnop.apps.googleusercontent.com
            client-secret: GOCSPX-abcdefghijklmnopqrstuvwxyz
```

### 방법 2: 환경 변수 사용 (권장, 보안에 유리)

PowerShell에서:
```powershell
$env:GOOGLE_CLIENT_ID="여기에-발급받은-Client-ID-입력"
$env:GOOGLE_CLIENT_SECRET="여기에-발급받은-Client-Secret-입력"
$env:JWT_SECRET="여기에-JWT-Secret-입력-최소-32자"
```

그리고 백엔드 실행:
```bash
cd backend
./gradlew bootRun
```

## JWT Secret 생성

JWT Secret이 없다면 다음 명령어로 생성:

**PowerShell:**
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

또는 온라인 생성기 사용: https://www.random.org/strings/

## 확인 사항

1. ✅ Google Cloud Console에서 "승인된 리디렉션 URI"에 다음이 추가되어 있는지 확인:
   ```
   http://localhost:8080/api/auth/google/callback
   ```

2. ✅ Client ID와 Client Secret이 정확한지 확인

3. ✅ 백엔드 실행 후 테스트:
   ```
   http://localhost:8080/api/auth/google/login
   ```

## 자세한 내용

더 자세한 설정 방법은 [13_BACKEND_ENVIRONMENT_SETUP.md](../13_BACKEND_ENVIRONMENT_SETUP.md)를 참고하세요.
