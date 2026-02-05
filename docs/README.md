# 문서 (docs)

설계·배포·운영 문서를 **번호대별 폴더**로 정리한 목차입니다.

## 폴더 구조

```
docs/
├── README.md           ← 현재 문서 (목차)
├── 00_environment/     환경 (00~03: 백엔드 설정·Redis·자동화·Jenkins)
├── 10_design/          설계 (10~11: 아키텍처·요구사항)
├── 20_backend/         API·백엔드 (20: API 명세)
├── 30_db/              DB (30~31: DB 설계·RDBMS)
├── 40_frontend/        UI·프론트 (40~41: UI/UX·코딩 규약)
├── 50_deployment/      배포 (50~51 + 계획·SSL)
├── 60_infra/           인프라 (60~62: MQ·모니터링·MSA)
├── 99/                 설계 문서 인덱스 (목차)
└── project/            프로젝트 현황·보안·광고
```

## 목차

### 99/ — 설계 문서 인덱스

| 문서 | 설명 |
|------|------|
| [99_DESIGN_DOCUMENTS_INDEX.md](99/99_DESIGN_DOCUMENTS_INDEX.md) | **전체 설계서 목차** (번호대·의존성) |

### 00_environment/ — 환경

| 문서 | 설명 |
|------|------|
| [00_BACKEND_ENVIRONMENT_SETUP.md](00_environment/00_BACKEND_ENVIRONMENT_SETUP.md) | 백엔드 환경 설정 |
| [01_REDIS_GUIDE.md](00_environment/01_REDIS_GUIDE.md) | **Redis 사용 정리** |
| [02_AUTOMATION.md](00_environment/02_AUTOMATION.md) | 자동화 (CI·로컬 검사) |
| [03_JENKINS_AND_MONITORING.md](00_environment/03_JENKINS_AND_MONITORING.md) | Jenkins·모니터링 |

### 10_design/ — 설계

| 문서 | 설명 |
|------|------|
| [10_SYSTEM_ARCHITECTURE.md](10_design/10_SYSTEM_ARCHITECTURE.md) | 시스템 아키텍처 |
| [11_REQUIREMENTS.md](10_design/11_REQUIREMENTS.md) | 요구사항 명세서 |

### 20_backend/ — API

| 문서 | 설명 |
|------|------|
| [20_API_SPECIFICATION.md](20_backend/20_API_SPECIFICATION.md) | API 명세서 |

### 30_db/ — DB

| 문서 | 설명 |
|------|------|
| [30_DATABASE_DESIGN.md](30_db/30_DATABASE_DESIGN.md) | 데이터베이스 설계서 |
| [31_RDBMS_RECOMMENDATION.md](30_db/31_RDBMS_RECOMMENDATION.md) | RDBMS 선택 가이드 |

### 40_frontend/ — UI·프론트

| 문서 | 설명 |
|------|------|
| [40_UI_UX_DESIGN.md](40_frontend/40_UI_UX_DESIGN.md) | UI/UX 설계서 |
| [41_CODING_CONVENTIONS.md](40_frontend/41_CODING_CONVENTIONS.md) | 코딩 규약 |

### 50_deployment/ — 배포

| 문서 | 설명 |
|------|------|
| [50_DEPLOYMENT_GUIDE.md](50_deployment/50_DEPLOYMENT_GUIDE.md) | 배포 가이드 (NAS·Docker·클라우드) |
| [51_KUBERNETES_DEPLOYMENT.md](50_deployment/51_KUBERNETES_DEPLOYMENT.md) | Kubernetes 배포 |

*로컬 전용(Git 제외):* `DEPLOYMENT_PLAN.md`, `SSL_HTTPS_SETUP.md`

### 60_infra/ — 인프라

| 문서 | 설명 |
|------|------|
| [60_MQ_KAFKA_GUIDE.md](60_infra/60_MQ_KAFKA_GUIDE.md) | MQ/Kafka 가이드 |
| [61_SPRING_MONITORING.md](60_infra/61_SPRING_MONITORING.md) | Spring 모니터링 |
| [62_MSA_ARCHITECTURE.md](60_infra/62_MSA_ARCHITECTURE.md) | MSA 아키텍처 |

### project/ — 프로젝트 현황·보안

| 문서 | 설명 |
|------|------|
| [FEATURE_PROGRESS.md](project/FEATURE_PROGRESS.md) | 기능별 진행 현황 |
| [SECURITY_CHECKLIST.md](project/SECURITY_CHECKLIST.md) | 보안 점검 체크리스트 |
| [ADSENSE_SAFETY.md](project/ADSENSE_SAFETY.md) | AdSense 광고 필터 |
| [GIT_IGNORE_GUIDE.md](project/GIT_IGNORE_GUIDE.md) | Git 제외 항목 분류 |

## 백엔드 전용 (backend/)

| 문서 | 설명 |
|------|------|
| [backend/README.md](../backend/README.md) | 백엔드 개요·실행 |
| [backend/SETUP_GUIDE.md](../backend/SETUP_GUIDE.md) | OAuth·JWT·Redis 초기 설정 |
| [backend/DATABASE_SETUP.md](../backend/DATABASE_SETUP.md) | DB 설치·스키마 |
| [backend/CHECK_OAUTH_CONFIG.md](../backend/CHECK_OAUTH_CONFIG.md) | OAuth 설정 확인 |
| [backend/RUN.md](../backend/RUN.md) | 실행 방법 상세 |
