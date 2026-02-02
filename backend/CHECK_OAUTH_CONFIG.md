# Google OAuth 설정 확인 가이드

## 오류: "The OAuth client was not found" / "invalid_client"

이 오류는 Google OAuth 클라이언트 ID나 Secret이 제대로 설정되지 않았을 때 발생합니다.

## 확인 사항

### 1. 환경 변수 확인

PowerShell에서 현재 설정된 환경 변수 확인:

```powershell
echo "GOOGLE_CLIENT_ID: $env:GOOGLE_CLIENT_ID"
echo "GOOGLE_CLIENT_SECRET: $env:GOOGLE_CLIENT_SECRET"
```

**예상 출력:**
```
GOOGLE_CLIENT_ID: 123456789-abcdefghijklmnop.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET: GOCSPX-abcdefghijklmnopqrstuvwxyz
```

**문제가 있는 경우:**
- 빈 값이 표시되면 환경 변수가 설정되지 않은 것입니다.
- `your-google-client-id`가 표시되면 기본값이 사용되고 있는 것입니다.

### 2. 환경 변수 설정

환경 변수가 설정되지 않았다면:

```powershell
# 반드시 따옴표 사용!
$env:GOOGLE_CLIENT_ID="여기에-실제-Client-ID-입력"
$env:GOOGLE_CLIENT_SECRET="여기에-실제-Client-Secret-입력"
```

**중요:**
- Client ID는 `.apps.googleusercontent.com`으로 끝나야 합니다.
- Client Secret은 `GOCSPX-`로 시작합니다.
- 따옴표를 반드시 사용하세요.

### 3. Google Cloud Console 확인

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 프로젝트 선택
3. **"API 및 서비스"** > **"사용자 인증 정보"** 이동
4. OAuth 2.0 클라이언트 ID 목록 확인
5. 클라이언트가 생성되어 있는지 확인

### 4. OAuth 클라이언트 생성 (없는 경우)

1. **"+ 사용자 인증 정보 만들기"** 클릭
2. **"OAuth 클라이언트 ID"** 선택
3. **애플리케이션 유형**: **"웹 애플리케이션"** 선택
4. **이름**: `markdown-viewer-backend`
5. **승인된 리디렉션 URI** 추가:
   ```
   http://localhost:8080/api/auth/google/callback
   ```
6. **"만들기"** 클릭
7. **Client ID**와 **Client Secret** 복사

### 5. 백엔드 재시작

환경 변수를 설정한 후 **반드시 백엔드를 재시작**해야 합니다:

```powershell
# 백엔드 중지 (Ctrl+C)
# 환경 변수 설정
$env:GOOGLE_CLIENT_ID="실제-Client-ID"
$env:GOOGLE_CLIENT_SECRET="실제-Client-Secret"

# 백엔드 재시작
cd c:\tmp\markdown_viewer_v2\backend
.\gradlew.bat bootRun
```

### 6. application.yml 직접 설정 (대안)

환경 변수가 작동하지 않는 경우, `application.yml`에 직접 설정:

```yaml
spring:
  security:
    oauth2:
      client:
        registration:
          google:
            client-id: 실제-Client-ID.apps.googleusercontent.com
            client-secret: 실제-Client-Secret
```

**주의**: 이 방법은 Git에 커밋하지 마세요!

## 일반적인 실수

1. ❌ 환경 변수 설정 후 백엔드를 재시작하지 않음
2. ❌ 따옴표 없이 환경 변수 설정 (`$env:GOOGLE_CLIENT_ID=value` - 오류 발생)
3. ❌ Client ID에 `.apps.googleusercontent.com`이 빠짐
4. ❌ Google Cloud Console에서 클라이언트를 생성하지 않음
5. ❌ 승인된 리디렉션 URI가 정확하지 않음

## 확인 체크리스트

- [ ] Google Cloud Console에서 OAuth 클라이언트 생성됨
- [ ] Client ID가 `.apps.googleusercontent.com`으로 끝남
- [ ] Client Secret이 `GOCSPX-`로 시작함
- [ ] 환경 변수가 올바르게 설정됨 (따옴표 사용)
- [ ] 환경 변수 설정 후 백엔드 재시작함
- [ ] 승인된 리디렉션 URI에 `http://localhost:8080/api/auth/google/callback` 추가됨

## 추가 도움말

자세한 설정 방법은 [13_BACKEND_ENVIRONMENT_SETUP.md](../13_BACKEND_ENVIRONMENT_SETUP.md)를 참고하세요.
