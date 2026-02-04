# 보안 점검 체크리스트

프로젝트의 보안 관련 이슈와 권장 조치를 정리한 문서입니다.

---

## 1. 높음 (우선 조치 권장)

### 1.1 마크다운 렌더링 XSS (Stored XSS)

| 항목 | 내용 |
|------|------|
| **위치** | `frontend/src/features/markdown-renderer` |
| **문제** | `marked.parse()` 결과를 그대로 `innerHTML`에 넣고 있음. 마크다운/HTML에 `<script>`, `<img onerror=...>` 등이 포함되면 스크립트 실행 가능. |
| **권장** | HTML 출력 전 **DOMPurify** 등으로 샌드박싱: `DOMPurify.sanitize(marked.parse(markdown))`. |

### 1.2 JWT 토큰이 URL 쿼리에 노출

| 항목 | 내용 |
|------|------|
| **위치** | OAuth 성공 시 `SecurityConfig` → `redirectUrl = .../auth/google/callback?token=JWT` |
| **문제** | 토큰이 브라우저 히스토리, Referer, 서버/프록시 로그에 남을 수 있음. |
| **권장** | 가능하면 **fragment** 사용 (`#token=...`) 또는 **단회용 코드**로 토큰 교환 후 즉시 제거. 최소한 리다이렉트 후 클라이언트에서 히스토리에서 토큰 제거(`replaceState`) 고려. |

### 1.3 application.yml 기본 비밀번호

| 항목 | 내용 |
|------|------|
| **위치** | `backend/src/main/resources/application.yml` |
| **문제** | `password: ${DB_PASSWORD:adgjadgj11}` — 기본값이 저장소에 커밋됨. 운영에서 env 미설정 시 해당 값 사용. |
| **권장** | **운영 환경에서는 반드시** `DB_PASSWORD`, `JWT_SECRET`, `GOOGLE_CLIENT_SECRET` 등을 환경 변수로만 주입. 기본값은 `your-password-change-me` 등 placeholder로 두거나, 기본값 제거 후 env 필수로. `.env`는 이미 `.gitignore`에 있음. |

---

## 2. 중간 (설정·운영 보강)

### 2.1 CORS

| 항목 | 내용 |
|------|------|
| **위치** | `SecurityConfig.corsConfigurationSource()` |
| **현재** | `localhost:3000`, `localhost:5173`, `127.0.0.1:5173`만 허용. |
| **권장** | 운영 시 `app.frontend-url`(또는 전용 CORS 설정)으로 **실제 프론트 도메인만** 허용. 와일드카드 `*` 사용 지양. |

### 2.2 JWT 시크릿

| 항목 | 내용 |
|------|------|
| **위치** | `application.yml` → `jwt.secret: ${JWT_SECRET:...}` |
| **권장** | 운영에서는 **256비트 이상 랜덤 시크릿**을 env로 설정. 기본값으로 서비스하지 않기. |

### 2.3 CSRF 비활성화

| 항목 | 내용 |
|------|------|
| **위치** | `SecurityConfig` — `csrf.disable()` |
| **현재** | JWT 기반 API + OAuth 콜백 때문에 CSRF 비활성화. |
| **권장** | API 전용·SameSite 쿠키 미사용 구조면 흔한 선택. 쿠키 기반 세션 도입 시 CSRF 재검토. |

### 2.4 에러 메시지/스택 노출

| 항목 | 내용 |
|------|------|
| **위치** | `frontend/src/app/index.ts` — `error.message`, `error.stack`를 HTML에 출력 |
| **문제** | 초기화 실패 시 스택이 사용자 화면에 그대로 노출될 수 있음. |
| **권장** | 운영 빌드에서는 일반 메시지만 보여주고, 상세/스택은 로그/모니터링으로만 전송. |

---

## 3. 적절히 적용된 항목

| 항목 | 내용 |
|------|------|
| **Path Traversal** | `FileService.sanitizePath()` — `..`, 절대경로 `/` 차단. |
| **파일 경로** | 사용자별 디렉터리(`userDir(userId)`), path는 상대 경로만 허용. |
| **인증** | `/files/**` 등 API는 JWT 필터로 인증, 사용자별 데이터 격리. |
| **민감 설정** | `.env`가 `.gitignore`에 포함되어 커밋 제외. |
| **OAuth** | Google OAuth2, redirect_uri 설정 가능. |

---

## 4. 권장 조치 요약

1. **마크다운 XSS**: DOMPurify(또는 동등 라이브러리) 도입 후 `marked` 출력을 항상 sanitize.
2. **JWT in URL**: fragment 또는 단회 코드 방식으로 전환 검토; 단기적으로는 리다이렉트 후 URL 정리.
3. **application.yml**: 운영에서는 DB/JWT/OAuth 비밀·시크릿에 기본값 사용 금지, env 필수.
4. **CORS**: 운영 도메인만 명시적으로 허용.
5. **에러 노출**: 운영에서는 사용자 화면에 스택/내부 메시지 노출 최소화.

---

## 문서 정보

- **기준**: 일반적인 웹/API 보안 관행 및 OWASP 요약
- **작성일**: 2026-02-02
- **비고**: 배포 전 보안 점검 시 참고용. 정기적으로 재검토 권장.
