# Markdown Viewer V2

Google 로그인 기반의 안전하고 사용하기 편한 마크다운 뷰어 및 에디터

## 프로젝트 개요

마크다운 뷰어 V2는 개인 파일의 프라이버시를 보호하면서도 직관적이고 편안한 사용자 경험을 제공하는 웹 기반 마크다운 뷰어 및 에디터입니다.

### 프로젝트 목적

이 프로젝트는 **실무에서 요구되는 핵심 기술 스택을 경험**하기 위한 학습 프로젝트입니다:

- 🎯 **수요 있는 프로젝트**: 실제 사용자에게 가치를 제공하는 서비스
- 🏗️ **MSA**: 작은 프로젝트에서도 MSA 패턴 적용 및 경험
- 🚀 **Kubernetes**: 컨테이너 오케스트레이션 및 마이크로서비스 배포 경험
- 📨 **비동기 처리**: MQ (RabbitMQ) 또는 Kafka를 활용한 스트림 처리 및 이벤트 기반 아키텍처
- 💾 **캐싱 전략**: 다양한 캐싱 레이어 (L1/L2 캐시, 분산 캐시, CDN) 설계 및 구현
- 📊 **대용량 트래픽 대응**: 로드 밸런싱, 오토스케일링, 데이터베이스 샤딩, 성능 최적화
- 📈 **모니터링 및 관찰성**: 메트릭, 로깅, 트레이싱을 통한 시스템 가시성 확보

**기본적이면서도 다양한 기술을 경험할 수 있는 실전 프로젝트입니다.**

### 주요 기능

- ✅ **Google OAuth 로그인**: 별도의 회원가입 없이 빠른 인증
- ✅ **사용자별 폴더 관리**: 멀티테넌트 구조로 데이터 격리
- ✅ **마크다운 뷰어**: 파일 열기 시 즉시 렌더링된 콘텐츠 표시
- ✅ **편집 기능**: 전체 화면 편집 모드
- ✅ **Smart Paste**: 붙여넣기 시 마크다운 형식 자동 인식
- ✅ **자동 저장**: localStorage 즉시 저장 + 서버 주기적 저장
- ✅ **파일 암호화**: 클라이언트 사이드 AES-256-GCM 암호화
- ✅ **로컬 파일 관리**: File System Access API 지원
- ✅ **백그라운드 업데이트 방지**: Page Visibility API 활용

## 기술 스택

### 프론트엔드
- **언어**: TypeScript 5.2+
- **빌드 도구**: Vite 5.0+
- **아키텍처**: Feature-Sliced Design (FSD)
- **스타일**: CSS3 (Variables, Grid, Flexbox)
- **라이브러리**: Highlight.js, Font Awesome

### 백엔드
- **프레임워크**: Spring Boot 3.2
- **언어**: Java 21
- **인증**: Spring Security, OAuth2(Google), JWT
- **데이터베이스**: MariaDB (JPA)
- **캐싱**: Spring Cache (Redis 선택 / 인메모리 기본)
- **모니터링**: Actuator, Micrometer, Prometheus
- **확장(선택)**: Redis(블랙리스트·캐시), MQ/Kafka(설계 문서 참고)

### 인프라
- **컨테이너**: Docker
- **오케스트레이션**: Kubernetes
- **로드 밸런싱**: Nginx Ingress Controller
- **스토리지**: Object Storage (S3 호환) 또는 NFS

## 프로젝트 구조

```
markdown_viewer_v2/
├── frontend/              # 프론트엔드 애플리케이션
│   ├── src/
│   │   ├── app/          # 애플리케이션 진입점
│   │   ├── pages/        # 페이지 레벨
│   │   ├── widgets/      # 복합 UI 블록
│   │   ├── features/     # 비즈니스 기능
│   │   ├── entities/     # 비즈니스 엔티티
│   │   └── shared/       # 공유 코드
│   ├── package.json
│   └── vite.config.ts
│
├── docs/                        # 설계·배포·운영 문서 (폴더별 정리)
│   ├── README.md                # 문서 목차
│   ├── 00_environment/          # 환경 (00~03)
│   ├── 10_design/               # 설계 (10~11)
│   ├── 20_backend/              # API (20)
│   ├── 30_db/                   # DB (30~31)
│   ├── 40_frontend/             # UI·프론트 (40~41)
│   ├── 50_deployment/           # 배포 (50~51)
│   ├── 60_infra/                # 인프라 (60~62)
│   ├── 99/                      # 설계 문서 인덱스
│   └── project/                 # 진행 현황·보안·AdSense
```

## 시작하기

### 프론트엔드 개발

```bash
cd frontend
npm install
npm run dev
```

개발 서버는 `http://localhost:5173`에서 실행됩니다.

### 빌드

```bash
npm run build
```

## 개발 원칙

1. **UX/UI 우선**: 직관적이고 매력적인 화면 구성
2. **성능 최적화**: 필요 시에만 최적화 적용
3. **유지보수 가능한 아키텍처**: FSD 구조로 관심사 분리
4. **안정성과 확장성**: TypeScript 필수 사용
5. **개발자 경험**: 읽기 좋은 깔끔한 코드
6. **크로스 브라우징**: 다양한 브라우저 및 OS 환경 지원

> 💡 **코딩 규약**: 프로젝트의 코딩 스타일과 규칙은 [코딩 규약 및 스타일 가이드](docs/40_frontend/41_CODING_CONVENTIONS.md)를 참고하세요.

## 자동화

빌드·테스트·실행을 한 번에 처리할 수 있습니다.

| 목적 | Windows | Linux/macOS |
|------|---------|-------------|
| **전체 검사** (lint + test) | `.\scripts\check.ps1` | `./scripts/check.sh` |
| **개발 서버** (백엔드+프론트) | `.\scripts\run-dev.ps1` | `./scripts/run-dev.sh` |

- **CI**: GitHub에 push 시 [GitHub Actions](.github/workflows/ci.yml)가 자동으로 빌드·테스트 실행. Jenkins 사용 시 루트의 `Jenkinsfile` 사용.
- 상세: [docs/00_environment/02_AUTOMATION.md](docs/00_environment/02_AUTOMATION.md), [docs/00_environment/03_JENKINS_AND_MONITORING.md](docs/00_environment/03_JENKINS_AND_MONITORING.md)

## 문서

**설계·배포·운영 문서는 [docs/](docs/)에 폴더별로 정리되어 있으며**, [docs/README.md](docs/README.md)에서 목차를 확인할 수 있습니다.

| 구분 | 문서 |
|------|------|
| **목차** | [docs/README.md](docs/README.md) · [설계 인덱스](docs/99/99_DESIGN_DOCUMENTS_INDEX.md) |
| **설계** | [10 아키텍처](docs/10_design/10_SYSTEM_ARCHITECTURE.md) · [11 요구사항](docs/10_design/11_REQUIREMENTS.md) · [20 API](docs/20_backend/20_API_SPECIFICATION.md) · [30 DB](docs/30_db/30_DATABASE_DESIGN.md) · [40 UI/UX](docs/40_frontend/40_UI_UX_DESIGN.md) |
| **배포** | [50 배포 가이드](docs/50_deployment/50_DEPLOYMENT_GUIDE.md) · [51 Kubernetes](docs/50_deployment/51_KUBERNETES_DEPLOYMENT.md) *(배포 계획·SSL/HTTPS는 로컬 전용)* |
| **인프라·개발** | [00 백엔드 환경](docs/00_environment/00_BACKEND_ENVIRONMENT_SETUP.md) · [01 Redis](docs/00_environment/01_REDIS_GUIDE.md) · [02 자동화](docs/00_environment/02_AUTOMATION.md) · [03 Jenkins](docs/00_environment/03_JENKINS_AND_MONITORING.md) · [31 RDBMS](docs/30_db/31_RDBMS_RECOMMENDATION.md) · [41 코딩 규약](docs/40_frontend/41_CODING_CONVENTIONS.md) · [60 MQ/Kafka](docs/60_infra/60_MQ_KAFKA_GUIDE.md) · [61 모니터링](docs/60_infra/61_SPRING_MONITORING.md) · [62 MSA](docs/60_infra/62_MSA_ARCHITECTURE.md) |
| **기타** | [기능 진행](docs/project/FEATURE_PROGRESS.md) · [보안 체크리스트](docs/project/SECURITY_CHECKLIST.md) · [AdSense](docs/project/ADSENSE_SAFETY.md) |
| **백엔드 전용** | [backend/README.md](backend/README.md) · [backend/SETUP_GUIDE.md](backend/SETUP_GUIDE.md) · [backend/DATABASE_SETUP.md](backend/DATABASE_SETUP.md) · [backend/CHECK_OAUTH_CONFIG.md](backend/CHECK_OAUTH_CONFIG.md) · [backend/RUN.md](backend/RUN.md) |

## 라이선스

이 프로젝트는 [MIT License](LICENSE) 하에 배포됩니다.

Copyright (c) 2026 Markdown Viewer V2
