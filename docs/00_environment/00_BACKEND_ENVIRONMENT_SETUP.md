# 백엔드 환경 설정 가이드

## 문서 정보
- **프로젝트**: 마크다운 뷰어 V2
- **버전**: 1.0
- **작성일**: 2026-02-02
- **기반 문서**: [10_SYSTEM_ARCHITECTURE.md](../10_design/10_SYSTEM_ARCHITECTURE.md), [20_API_SPECIFICATION.md](../20_backend/20_API_SPECIFICATION.md)

## 목차
1. [개요](#개요)
2. [필수 요구사항](#필수-요구사항)
3. [Google OAuth2 설정](#google-oauth2-설정)
4. [환경 변수 설정](#환경-변수-설정)
5. [데이터베이스 설정](#데이터베이스-설정)
6. [JWT Secret 생성](#jwt-secret-생성)
7. [테스트 및 검증](#테스트-및-검증)
8. [문제 해결](#문제-해결)
9. [보안 주의사항](#보안-주의사항)

---

## 개요

백엔드 서버를 실행하기 위해 필요한 환경 설정 가이드입니다. Google OAuth2 인증, 데이터베이스 연결, JWT 토큰 설정 등을 포함합니다.

### 설정 항목

- **Google OAuth2**: 사용자 인증을 위한 Google Cloud Console 설정
- **데이터베이스**: MariaDB 연결 설정
- **JWT**: 토큰 발급 및 검증을 위한 Secret Key 설정
- **환경 변수**: 민감한 정보 관리

---

## 필수 요구사항

### 소프트웨어 요구사항

- **Java**: 17 이상
- **MariaDB**: 10.11 이상
- **Gradle**: 7.0 이상 (또는 Gradle Wrapper 사용)

### 계정 및 인증 정보

- **Google 계정**: Google Cloud Console 접근용
- **Google OAuth2 클라이언트**: Client ID 및 Secret
- **데이터베이스 계정**: MariaDB 사용자명 및 비밀번호

---

## Google OAuth2 설정

### 1. Google Cloud Console 프로젝트 생성

1. [Google Cloud Console](https://console.cloud.google.com/)에 접속
2. 상단 프로젝트 선택 메뉴에서 **"새 프로젝트"** 클릭
3. 프로젝트 이름 입력 (예: `markdown-viewer`)
4. **"만들기"** 클릭

### 2. OAuth 동의 화면 설정

1. 왼쪽 메뉴에서 **"API 및 서비스"** > **"OAuth 동의 화면"** 선택
2. **"외부"** 선택 후 **"만들기"** 클릭
3. 필수 정보 입력:
   - **앱 이름**: 마크다운 뷰어 (또는 원하는 이름)
   - **사용자 지원 이메일**: 본인 이메일
   - **앱 로고**: 선택사항
   - **앱 도메인**: 선택사항
   - **개발자 연락처 정보**: 본인 이메일
4. **"저장 후 계속"** 클릭
5. **"범위"** 화면에서 **"저장 후 계속"** 클릭 (기본 범위 사용)
6. **"테스트 사용자"** 화면에서:
   - 테스트 중인 경우 본인 Google 계정 추가
   - 또는 **"저장 후 계속"** 클릭
7. **"요약"** 화면에서 **"대시보드로 돌아가기"** 클릭

### 3. OAuth2 클라이언트 ID 생성

1. 왼쪽 메뉴에서 **"API 및 서비스"** > **"사용자 인증 정보"** 선택
2. 상단 **"+ 사용자 인증 정보 만들기"** 클릭
3. **"OAuth 클라이언트 ID"** 선택
4. **애플리케이션 유형**: **"웹 애플리케이션"** 선택
5. **이름**: `markdown-viewer-backend` (또는 원하는 이름)
6. **승인된 리디렉션 URI** 추가:
   ```
   http://localhost:8080/api/auth/google/callback
   ```
   (프로덕션 환경에서는 실제 도메인으로 변경)
7. **"만들기"** 클릭
8. **Client ID**와 **Client Secret**이 표시됩니다. 이 정보를 복사해두세요.

### 리다이렉트 URI 설정

#### 개발 환경
```
http://localhost:8080/api/auth/google/callback
```

#### 프로덕션 환경
```
https://yourdomain.com/api/auth/google/callback
```

**중요**: Google Cloud Console의 **"승인된 리디렉션 URI"**에 정확히 일치하는 URI를 추가해야 합니다.

---

## 환경 변수 설정

### 방법 1: 환경 변수로 설정 (권장)

시스템 환경 변수로 설정:

**Linux/macOS:**
```bash
export GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
export GOOGLE_CLIENT_SECRET="your-client-secret"
export GOOGLE_REDIRECT_URI="http://localhost:8080/api/auth/google/callback"
export JWT_SECRET="your-secret-key-min-256-bits-long"
export FRONTEND_URL="http://localhost:3000"
export DB_USERNAME="root"
export DB_PASSWORD="password"
```

**Windows (PowerShell):**
```powershell
# 반드시 따옴표 사용 (PowerShell에서는 필수)
$env:GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
$env:GOOGLE_CLIENT_SECRET="your-client-secret"
$env:GOOGLE_REDIRECT_URI="http://localhost:8080/api/auth/google/callback"
$env:JWT_SECRET="your-secret-key-min-256-bits-long"
$env:FRONTEND_URL="http://localhost:3000"
$env:DB_USERNAME="root"
$env:DB_PASSWORD="password"
```

**중요**: PowerShell에서는 환경 변수 값에 **반드시 따옴표를 사용**해야 합니다. 따옴표 없이 입력하면 PowerShell이 값을 명령어로 해석하여 오류가 발생합니다.

### 방법 2: application.yml 직접 수정

`backend/src/main/resources/application.yml` 파일에서:

```yaml
spring:
  datasource:
    username: root
    password: password
  
  security:
    oauth2:
      client:
        registration:
          google:
            client-id: your-client-id.apps.googleusercontent.com
            client-secret: your-client-secret
            redirect-uri: http://localhost:8080/api/auth/google/callback

jwt:
  secret: your-secret-key-min-256-bits-long

app:
  frontend-url: http://localhost:3000
```

**주의**: 이 방법은 Git에 커밋하지 마세요. `.gitignore`에 추가되어 있습니다.

### 방법 3: application-local.yml 생성 (로컬 개발용)

`backend/src/main/resources/application-local.yml` 파일 생성:

```yaml
spring:
  datasource:
    username: ${DB_USERNAME:root}
    password: ${DB_PASSWORD:password}
  
  security:
    oauth2:
      client:
        registration:
          google:
            client-id: ${GOOGLE_CLIENT_ID}
            client-secret: ${GOOGLE_CLIENT_SECRET}
            redirect-uri: ${GOOGLE_REDIRECT_URI:http://localhost:8080/api/auth/google/callback}

jwt:
  secret: ${JWT_SECRET}

app:
  frontend-url: ${FRONTEND_URL:http://localhost:3000}
```

그리고 실행 시 프로파일 지정:
```bash
./gradlew bootRun --args='--spring.profiles.active=local'
```

---

## 데이터베이스 설정

### 1. MariaDB 설치 및 실행

MariaDB를 설치하고 실행합니다.

### 2. 데이터베이스 생성

```sql
CREATE DATABASE markdown_viewer CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 3. 사용자 생성 및 권한 부여 (선택사항)

```sql
CREATE USER 'markdown_user'@'localhost' IDENTIFIED BY 'password';
GRANT ALL PRIVILEGES ON markdown_viewer.* TO 'markdown_user'@'localhost';
FLUSH PRIVILEGES;
```

### 4. application.yml 설정

```yaml
spring:
  datasource:
    url: jdbc:mariadb://localhost:3306/markdown_viewer?useUnicode=true&characterEncoding=utf8&serverTimezone=Asia/Seoul
    username: ${DB_USERNAME:root}
    password: ${DB_PASSWORD:password}
    driver-class-name: org.mariadb.jdbc.Driver
  
  jpa:
    hibernate:
      ddl-auto: update  # 개발 환경: update, 프로덕션: validate 또는 none
    show-sql: true
    properties:
      hibernate:
        format_sql: true
        dialect: org.hibernate.dialect.MariaDBDialect
```

---

## JWT Secret 생성

JWT 토큰 서명에 사용할 Secret Key를 생성하세요. 최소 256비트(32바이트) 이상이어야 합니다.

### 방법 1: OpenSSL 사용 (권장)

```bash
openssl rand -base64 32
```

### 방법 2: 온라인 생성기 사용

- [Random.org](https://www.random.org/strings/) 사용
- 길이: 32자 이상

### 방법 3: 간단한 문자열 (개발용, 프로덕션에서는 사용 금지)

```
your-secret-key-change-this-in-production-min-256-bits
```

**중요**: 프로덕션 환경에서는 반드시 강력한 랜덤 Secret을 사용하세요.

---

## 테스트 및 검증

### 1. 백엔드 실행

```bash
cd backend
./gradlew bootRun
```

### 2. 헬스 체크 확인

브라우저 또는 curl로 확인:

```bash
curl http://localhost:8080/api/health
```

예상 응답:
```json
{
  "success": true,
  "data": {
    "status": "UP",
    "service": "markdown-viewer-backend"
  }
}
```

### 3. Google 로그인 테스트

브라우저에서 다음 URL 접속:
```
http://localhost:8080/api/auth/google/login
```

Google 로그인 화면으로 리다이렉트되어야 합니다.

### 4. 콜백 확인

로그인 성공 후 다음 URL로 리다이렉트되어야 합니다:
```
http://localhost:3000/auth/google/callback?token=...
```

---

## 문제 해결

### "redirect_uri_mismatch" 오류

**증상**: Google 로그인 시 `redirect_uri_mismatch` 오류 발생

**해결 방법**:
- Google Cloud Console의 **"승인된 리디렉션 URI"**에 정확한 URI가 추가되어 있는지 확인
- 프로토콜(http/https), 포트, 경로가 정확히 일치해야 함
- 예: `http://localhost:8080/api/auth/google/callback` (슬래시 포함)

### "invalid_client" 오류

**증상**: `invalid_client` 오류 발생

**해결 방법**:
- Client ID와 Client Secret이 정확한지 확인
- 환경 변수가 제대로 로드되었는지 확인
- `application.yml`의 값이 올바른지 확인

### "access_denied" 오류

**증상**: `access_denied` 오류 발생

**해결 방법**:
- OAuth 동의 화면에서 테스트 사용자로 본인 계정이 추가되어 있는지 확인
- 앱이 아직 검토되지 않은 경우 테스트 사용자만 로그인 가능

### 데이터베이스 연결 실패

**증상**: 데이터베이스 연결 오류

**해결 방법**:
- MariaDB가 실행 중인지 확인
- 데이터베이스 이름, 사용자명, 비밀번호가 정확한지 확인
- 방화벽 설정 확인 (포트 3306)

### JWT 토큰 검증 실패

**증상**: JWT 토큰이 유효하지 않다고 나옴

**해결 방법**:
- JWT Secret이 정확한지 확인
- 토큰이 만료되지 않았는지 확인 (기본 24시간)
- 환경 변수 `JWT_SECRET`이 올바르게 설정되었는지 확인

---

## 보안 주의사항

### 1. Client Secret 보안

- **절대 공개하지 마세요**
  - Git에 커밋하지 마세요
  - 환경 변수나 설정 파일로 관리하세요
  - `.gitignore`에 `.env`, `application-local.yml` 등 추가

### 2. 프로덕션 환경

- **HTTPS 사용 필수**
  - HTTP는 개발 환경에서만 사용
  - 프로덕션에서는 반드시 HTTPS 사용

- **강력한 JWT Secret 사용**
  - 최소 256비트(32바이트) 이상
  - 랜덤하게 생성된 값 사용
  - 개발용 Secret을 프로덕션에서 사용하지 마세요

- **Google Cloud Console 설정**
  - 프로덕션 도메인 등록
  - 승인된 리디렉션 URI에 프로덕션 URL 추가

### 3. 환경 변수 관리

- **로컬 개발**
  - `.env` 파일 사용 (Git에 커밋하지 않음)
  - `application-local.yml` 사용 (Git에 커밋하지 않음)

- **프로덕션**
  - 환경 변수 또는 시크릿 관리 시스템 사용
  - Kubernetes Secrets, AWS Secrets Manager 등 활용

### 4. 데이터베이스 보안

- **강력한 비밀번호 사용**
- **최소 권한 원칙**: 필요한 권한만 부여
- **네트워크 보안**: 외부 접근 차단 (필요시)

---

## 환경 변수 요약

### 필수 환경 변수

| 변수명 | 설명 | 예시 |
|--------|------|------|
| `GOOGLE_CLIENT_ID` | Google OAuth2 Client ID | `xxxxx.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Google OAuth2 Client Secret | `GOCSPX-xxxxx` |
| `JWT_SECRET` | JWT 토큰 서명용 Secret | `base64-encoded-32-bytes` |
| `DB_USERNAME` | 데이터베이스 사용자명 | `root` |
| `DB_PASSWORD` | 데이터베이스 비밀번호 | `password` |

### 선택 환경 변수

| 변수명 | 설명 | 기본값 |
|--------|------|--------|
| `GOOGLE_REDIRECT_URI` | OAuth 리다이렉트 URI | `http://localhost:8080/api/auth/google/callback` |
| `FRONTEND_URL` | 프론트엔드 URL | `http://localhost:3000` |

---

## 참고 자료

- [Google OAuth2 문서](https://developers.google.com/identity/protocols/oauth2)
- [Spring Security OAuth2 Client 문서](https://docs.spring.io/spring-security/reference/servlet/oauth2/client/index.html)
- [MariaDB 문서](https://mariadb.com/kb/en/documentation/)
- [JWT.io](https://jwt.io/) - JWT 토큰 디버깅 도구

---

## 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|----------|
| 1.0 | 2026-02-02 | 초기 작성 |
