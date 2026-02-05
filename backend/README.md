# 마크다운 뷰어 백엔드

## 개요

마크다운 뷰어 V2 백엔드 서버입니다. Spring Boot 기반으로 구현되었습니다.

## 기술 스택

- **Java**: 21
- **Spring Boot**: 3.2.0
- **Spring Security**: OAuth2 Client (Google), JWT
- **JWT**: jjwt 0.12.3
- **Database**: MariaDB (JPA)
- **캐시/선택**: Spring Cache, Redis(선택 시 JWT 블랙리스트·메타데이터 캐시)
- **모니터링**: Actuator, Micrometer, Prometheus
- **Build**: Gradle

## 시작하기

### 필수 요구사항

- Java 21 이상
- MariaDB 10.11 이상
- Google OAuth2 클라이언트 ID 및 Secret

### Google OAuth2 설정

Google OAuth2를 사용하기 위해 Google Cloud Console에서 클라이언트를 생성해야 합니다.

**자세한 설정 방법은 [00_BACKEND_ENVIRONMENT_SETUP.md](../docs/00_environment/00_BACKEND_ENVIRONMENT_SETUP.md)를 참고하세요.** 빠른 설정은 [SETUP_GUIDE.md](SETUP_GUIDE.md)를 참고하세요.

### 환경 변수 설정

`.env` 파일을 생성하거나 환경 변수로 다음 값들을 설정하세요:

```env
DB_USERNAME=root
DB_PASSWORD=password
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:8080/api/auth/google/callback
JWT_SECRET=your-secret-key-change-this-in-production-min-256-bits
FRONTEND_URL=http://localhost:3000
```

**중요**: 
- `GOOGLE_CLIENT_ID`와 `GOOGLE_CLIENT_SECRET`은 Google Cloud Console에서 발급받아야 합니다.
- `JWT_SECRET`은 최소 256비트(32바이트) 이상의 랜덤 문자열이어야 합니다.
- `.env` 파일은 절대 Git에 커밋하지 마세요.

### 데이터베이스 설정

1. MariaDB 실행
2. 데이터베이스 생성:
```sql
CREATE DATABASE markdown_viewer CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 실행

```bash
./gradlew bootRun
```

또는

```bash
./gradlew build
java -jar build/libs/markdown-viewer-backend-1.0.0.jar
```

## API 엔드포인트

### 인증

- `GET /api/auth/google/login` - Google 로그인 시작
- `GET /api/auth/google/callback` - Google OAuth 콜백 처리
- `GET /api/auth/me` - 현재 사용자 정보 조회
- `POST /api/auth/logout` - 로그아웃

### 헬스 체크

- `GET /api/health` - 서버 상태 확인

## 프로젝트 구조

```
src/main/java/com/markdownviewer/
├── config/          # 설정 클래스
├── controller/      # REST 컨트롤러
├── dto/            # 데이터 전송 객체
├── entity/         # JPA 엔티티
├── repository/      # 데이터 접근 계층
├── service/         # 비즈니스 로직 계층
└── util/           # 유틸리티 클래스
```

## 참고 문서

- [SETUP_GUIDE.md](SETUP_GUIDE.md) — OAuth·JWT·Redis 등 초기 설정
- [DATABASE_SETUP.md](DATABASE_SETUP.md) — DB 설치·스키마
- [시스템 아키텍처](../docs/10_design/10_SYSTEM_ARCHITECTURE.md)
- [API 명세서](../docs/20_backend/20_API_SPECIFICATION.md)
- [데이터베이스 설계](../docs/30_db/30_DATABASE_DESIGN.md)
- [Redis 사용 정리](../docs/00_environment/01_REDIS_GUIDE.md) — Redis 용도·설정·미사용 시 동작
- [코딩 규약](../docs/40_frontend/41_CODING_CONVENTIONS.md)
- [문서 목차](../docs/README.md)
