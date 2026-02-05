# 설계 문서 인덱스

## 개요
이 문서는 마크다운 뷰어 V2 프로젝트의 모든 설계 문서에 대한 인덱스입니다. 문서는 **00번대(환경)**·**10~60번대(10단위 구분)**·**99(목차)**로 번호가 매겨져 있으며, **docs/** 아래 **번호대별 폴더**에 있습니다.

### 문서 위치 (폴더별)

| 폴더 | 문서 |
|------|------|
| **00_environment/** | 00~03 (백엔드 환경·Redis·자동화·Jenkins) |
| **10_design/** | 10~11 (아키텍처·요구사항) |
| **20_backend/** | 20 (API 명세) |
| **30_db/** | 30~31 (DB 설계·RDBMS) |
| **40_frontend/** | 40~41 (UI/UX·코딩 규약) |
| **50_deployment/** | 50~51 (배포·K8s) |
| **60_infra/** | 60~62 (MQ·모니터링·MSA) |
| **99/** | 99 (본 인덱스) |
| **project/** | 기능 진행·보안·AdSense·Git 제외 |

*주제별로 찾으려면 아래 분류별 보기·번호 체계를 사용하세요.*

### 번호 체계 (10단위 구분)

| 번호대 | 분류 | 해당 문서 (파일명) |
|--------|------|------------------------|
| **00번대** | **환경** | 00 백엔드 환경 설정, 01 Redis 가이드, 02 자동화, 03 Jenkins·모니터링 |
| **10번대** | 설계·아키텍처 | 10 시스템 아키텍처, 11 요구사항 명세서 |
| **20번대** | API·백엔드 | 20 API 명세서 |
| **30번대** | DB | 30 데이터베이스 설계서, 31 RDBMS 선택 가이드 |
| **40번대** | UI/UX·프론트 | 40 UI/UX 설계서, 41 코딩 규약 |
| **50번대** | 배포 | 50 배포 가이드, 51 Kubernetes 배포 |
| **60번대** | 인프라 | 60 MQ/Kafka, 61 Spring 모니터링, 62 MSA 아키텍처 |
| **99** | 목차 | 99 설계 문서 인덱스 (본 문서) |

### 분류별 보기 (주제별)

| 분류 | 해당 문서 | 비고 |
|------|-----------|------|
| **DB** | [30_DATABASE_DESIGN.md](../30_db/30_DATABASE_DESIGN.md), [31_RDBMS_RECOMMENDATION.md](../30_db/31_RDBMS_RECOMMENDATION.md) | 스키마·테이블·RDBMS 선택 |
| **백엔드** | [20_API_SPECIFICATION.md](../20_backend/20_API_SPECIFICATION.md), [00_BACKEND_ENVIRONMENT_SETUP.md](../00_environment/00_BACKEND_ENVIRONMENT_SETUP.md), [01_REDIS_GUIDE.md](../00_environment/01_REDIS_GUIDE.md) | API·환경 설정·Redis |
| **프론트** | [40_UI_UX_DESIGN.md](../40_frontend/40_UI_UX_DESIGN.md), [41_CODING_CONVENTIONS.md](../40_frontend/41_CODING_CONVENTIONS.md) | UI/UX 설계·코딩 규약(TS/FSD) |
| **환경** | [00_BACKEND_ENVIRONMENT_SETUP.md](../00_environment/00_BACKEND_ENVIRONMENT_SETUP.md), [01_REDIS_GUIDE.md](../00_environment/01_REDIS_GUIDE.md) | OAuth·DB·JWT·Redis·.env |
| **배포** | [50_DEPLOYMENT_GUIDE.md](../50_deployment/50_DEPLOYMENT_GUIDE.md), [51_KUBERNETES_DEPLOYMENT.md](../50_deployment/51_KUBERNETES_DEPLOYMENT.md) | NAS·Docker·K8s |
| **인프라·Dev** | [60 MQ/Kafka](../60_infra/60_MQ_KAFKA_GUIDE.md), [61 모니터링](../60_infra/61_SPRING_MONITORING.md), [62 MSA](../60_infra/62_MSA_ARCHITECTURE.md), [02 자동화](../00_environment/02_AUTOMATION.md), [03 Jenkins](../00_environment/03_JENKINS_AND_MONITORING.md) | MQ·모니터링·MSA·자동화·Jenkins |

*백엔드 실행·DB 설치 등 실행용 문서는 [백엔드 전용 문서](#백엔드-전용-문서-backend) 참고.*

## 문서 구조

### 99. 설계 문서 인덱스 (목차)
- **파일**: `99_DESIGN_DOCUMENTS_INDEX.md`
- **내용**: 모든 설계 문서의 목록 및 의존성 관리
- **상태**: ✅ 완료

### 00번대 — 환경
- **00** `00_BACKEND_ENVIRONMENT_SETUP.md` — Google OAuth2, DB, JWT, 환경 변수
- **01** `01_REDIS_GUIDE.md` — Redis 사용 정리 (JWT 블랙리스트·캐시)
- **02** `02_AUTOMATION.md` — CI, 로컬 검사, run-dev
- **03** `03_JENKINS_AND_MONITORING.md` — Jenkins·테스트·모니터링 요약

### 10번대 — 설계·아키텍처
- **10** `10_SYSTEM_ARCHITECTURE.md` — 전체 시스템 아키텍처 (최상위 설계)
- **11** `11_REQUIREMENTS.md` — 요구사항 명세서

### 20번대 — API·백엔드
- **20** `20_API_SPECIFICATION.md` — REST API 엔드포인트 상세

### 30번대 — DB
- **30** `30_DATABASE_DESIGN.md` — 데이터베이스 스키마·테이블
- **31** `31_RDBMS_RECOMMENDATION.md` — RDBMS 선택 가이드 (MariaDB 권장)

### 40번대 — UI/UX·프론트
- **40** `40_UI_UX_DESIGN.md` — UI/UX 설계서
- **41** `41_CODING_CONVENTIONS.md` — 코딩 규약 및 스타일 가이드

### 50번대 — 배포
- **50** `50_DEPLOYMENT_GUIDE.md` — NAS·클라우드 배포 가이드
- **51** `51_KUBERNETES_DEPLOYMENT.md` — Kubernetes 배포

### 60번대 — 인프라
- **60** `60_MQ_KAFKA_GUIDE.md` — MQ/Kafka 비동기 처리
- **61** `61_SPRING_MONITORING.md` — Spring Boot Actuator, Prometheus, Grafana
- **62** `62_MSA_ARCHITECTURE.md` — MSA 아키텍처 가이드

## 환경·운영 문서 (00번대)

| 번호 | 파일 | 설명 |
|------|------|------|
| 00 | 00_BACKEND_ENVIRONMENT_SETUP.md | 백엔드 환경 설정 |
| 01 | 01_REDIS_GUIDE.md | Redis 사용 정리 |
| 02 | 02_AUTOMATION.md | 자동화(CI, 로컬 검사, run-dev) |
| 03 | 03_JENKINS_AND_MONITORING.md | Jenkins·테스트·모니터링 요약 |

## 백엔드 전용 문서 (backend/)

백엔드 실행·DB·OAuth 설정 등은 다음을 참고하세요.

| 파일 | 설명 |
|------|------|
| [backend/README.md](../../backend/README.md) | 백엔드 개요·빌드·실행 |
| [backend/SETUP_GUIDE.md](../../backend/SETUP_GUIDE.md) | 초기 설정 가이드 |
| [backend/DATABASE_SETUP.md](../../backend/DATABASE_SETUP.md) | DB 설치·스키마 |
| [backend/CHECK_OAUTH_CONFIG.md](../../backend/CHECK_OAUTH_CONFIG.md) | OAuth 설정 확인 |
| [backend/RUN.md](../../backend/RUN.md) | 실행 방법 상세 |

## 문서 작성 순서 (번호대 기준)

1. ✅ 99. 설계 문서 인덱스 (완료)
2. ✅ 10. 시스템 아키텍처 (완료)
3. ✅ 11. 요구사항 명세서 (완료)
4. ✅ 20. API 명세서 (완료)
5. ✅ 30. 데이터베이스 설계서 (완료)
6. ✅ 40. UI/UX 설계서 (완료)
7. ✅ 50. 배포 가이드 (완료)
8. ✅ 51. Kubernetes 배포 가이드 (완료)
9. ✅ 60. MQ/Kafka 가이드 (완료)
10. ✅ 61. Spring 모니터링 가이드 (완료)
11. ✅ 62. MSA 아키텍처 가이드 (완료)
12. ✅ 31. RDBMS 선택 가이드 (완료)
13. ✅ 41. 코딩 규약 (완료)
14. ✅ 00. 백엔드 환경 설정 (완료)
15. ✅ 01. Redis 가이드 (완료)
16. ✅ 02. 자동화 가이드 (완료)
17. ✅ 03. Jenkins·모니터링 요약 (완료)

## 문서 간 의존성

```
99. 99_DESIGN_DOCUMENTS_INDEX.md (목차)
    │
    └── 10. 10_SYSTEM_ARCHITECTURE.md (최상위)
            ├── 11. 11_REQUIREMENTS.md (기반)
            ├── 20. 20_API_SPECIFICATION.md (기반)
            ├── 30. 30_DATABASE_DESIGN.md (기반)
            ├── 40. 40_UI_UX_DESIGN.md (기반)
            ├── 50. 50_DEPLOYMENT_GUIDE.md (기반)
            ├── 51. 51_KUBERNETES_DEPLOYMENT.md (기반)
            ├── 60. 60_MQ_KAFKA_GUIDE.md (기반)
            ├── 61. 61_SPRING_MONITORING.md (기반)
            ├── 62. 62_MSA_ARCHITECTURE.md (기반)
            ├── 31. 31_RDBMS_RECOMMENDATION.md (기반)
            ├── 41. 41_CODING_CONVENTIONS.md (기반)
            ├── 00. 00_BACKEND_ENVIRONMENT_SETUP.md (환경)
            ├── 01. 01_REDIS_GUIDE.md (환경)
            ├── 02. 02_AUTOMATION.md (환경)
            └── 03. 03_JENKINS_AND_MONITORING.md (환경)
```

### 문서 번호 체계 요약

| 번호대 | 번호 | 파일명 | 비고 |
|--------|------|--------|------|
| 99 | 99 | `99_DESIGN_DOCUMENTS_INDEX.md` | 목차 |
| 10번대 | 10 | `10_SYSTEM_ARCHITECTURE.md` | 최상위 설계 |
| 10번대 | 11 | `11_REQUIREMENTS.md` | 요구사항 |
| 20번대 | 20 | `20_API_SPECIFICATION.md` | API 명세 |
| 30번대 | 30 | `30_DATABASE_DESIGN.md` | DB 설계 |
| 30번대 | 31 | `31_RDBMS_RECOMMENDATION.md` | RDBMS 선택 |
| 40번대 | 40 | `40_UI_UX_DESIGN.md` | UI/UX 설계 |
| 40번대 | 41 | `41_CODING_CONVENTIONS.md` | 코딩 규약 |
| 50번대 | 50 | `50_DEPLOYMENT_GUIDE.md` | 배포 가이드 |
| 50번대 | 51 | `51_KUBERNETES_DEPLOYMENT.md` | K8s 배포 |
| 60번대 | 60 | `60_MQ_KAFKA_GUIDE.md` | MQ/Kafka |
| 60번대 | 61 | `61_SPRING_MONITORING.md` | 모니터링 |
| 60번대 | 62 | `62_MSA_ARCHITECTURE.md` | MSA |
| **00번대** | **00** | `00_BACKEND_ENVIRONMENT_SETUP.md` | **환경** 백엔드 설정 |
| **00번대** | **01** | `01_REDIS_GUIDE.md` | **환경** Redis |
| **00번대** | **02** | `02_AUTOMATION.md` | **환경** 자동화 |
| **00번대** | **03** | `03_JENKINS_AND_MONITORING.md` | **환경** Jenkins·모니터링 |

## 참고 사항

- **번호 체계**: **00번대 = 환경**, **10~60번대 = 10단위 구분**(설계·API·DB·UI·배포·인프라), **99 = 목차**.
- **99번 문서**는 모든 설계·환경·운영 문서의 목차 및 인덱스 역할을 합니다.
- **10번 문서** (시스템 아키텍처)는 최상위 문서로, 다른 모든 문서의 기반이 됩니다.
- **파일 위치**: 00~03 → `docs/00_environment/`, 10~11 → `docs/10_design/`, 20 → `docs/20_backend/`, 30~31 → `docs/30_db/`, 40~41 → `docs/40_frontend/`, 50~51 → `docs/50_deployment/`, 60~62 → `docs/60_infra/`, 99 → `docs/99/`.
- **백엔드 전용** 문서(SETUP_GUIDE, DATABASE_SETUP, CHECK_OAUTH_CONFIG, RUN)는 `backend/` 폴더에 있습니다.
