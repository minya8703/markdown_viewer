# Git에 올리지 않을 항목 분류

## 목적
저장소에는 **소스·설정·문서**만 두고, **의존성·빌드 결과·시크릿·사용자 데이터** 등은 Git에서 제외합니다.

---

## 1. 분류 요약

| 구분 | 예시 | 이유 |
|------|------|------|
| **의존성** | `node_modules/`, `target/` | `npm install`, `./gradlew build`로 재생성 가능 |
| **빌드 결과물** | `dist/`, `build/`, `*.jar` | 빌드 시 다시 생성됨 |
| **환경·시크릿** | `.env`, `.env.local` | DB 비밀번호·JWT·OAuth 시크릿 등, **절대 커밋 금지** |
| **사용자·런타임 데이터** | `backend/data/`, `*.db` | 사용자가 올린 파일·DB 파일, 개인 데이터·재생성 가능 |
| **IDE·에디터** | `.vscode/`, `.idea/`, `*.iml` | 개인/로컬 설정 |
| **OS 생성** | `.DS_Store`, `Thumbs.db` | OS가 만든 파일 |
| **로그·캐시·임시** | `logs/`, `*.log`, `.cache/` | 재실행 시 다시 생김 |
| **테스트·커버리지** | `coverage/` | 테스트 재실행으로 생성 |

---

## 2. 이 프로젝트에서 특히 중요한 것

### 반드시 제외 (보안·개인정보)
- **`.env`**, **`.env.local`**  
  - DB 비밀번호, `JWT_SECRET`, Google OAuth 시크릿 등.  
  - 템플릿만 올림: `.env.example`.
- **`backend/data/`**  
  - `app.file-storage-base-path`(기본 `./data`) 아래 사용자 파일.  
  - 사용자가 업로드·생성한 마크다운 등이 들어가므로 **커밋하지 않음**.

### 재생성 가능 (용량·노이즈 방지)
- **`node_modules/`**, **`target/`**  
  - 패키지·빌드 결과는 CI/로컬에서 다시 설치·빌드.
- **`dist/`**, **`build/`**  
  - 프론트/백엔드 빌드 산출물.

---

## 3. 예외 (Git에 두는 것)

| 항목 | 설명 |
|------|------|
| `.env.example` | 환경 변수 **이름·예시 값**만 포함, 실제 비밀 없음 |
| `gradle/wrapper/*` | Gradle Wrapper(JAR·properties) — 재현 가능한 빌드용 |
| `package-lock.json` | npm 의존성 고정 — 빌드 재현성 |

---

## 4. 로컬 전용 문서 (Git 제외)

배포·운영 참고용으로만 쓰고 저장소에는 넣지 않는 문서는 `.gitignore`에 두면 로컬에만 유지됩니다.

| 파일 | 설명 |
|------|------|
| `docs/deployment/DEPLOYMENT_PLAN.md` | NAS 배포 계획·Phase·체크리스트 |
| `docs/deployment/SSL_HTTPS_SETUP.md` | SSL/HTTPS 설정·인증서 자동 갱신 |

이 파일들은 로컬에서 편집·보관하고, clone 시에는 포함되지 않습니다.

---

## 5. 적용 위치

- **루트 `.gitignore`**: 전체 프로젝트 공통 규칙 + `backend/data/` + 로컬 전용 문서.
- **`backend/.gitignore`**: Spring/IDE 관련 추가 규칙.
- **`frontend/.gitignore`**: Node/프론트 빌드·테스트 관련.

이미 커밋된 파일을 나중에 무시하려면 `git rm --cached <파일>` 후 커밋해야 합니다.  
시크릿이 들어간 파일이 한 번이라도 커밋되었다면, 비밀번호·키를 교체하는 것이 안전합니다.
