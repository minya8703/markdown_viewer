# 문서 (docs)

설계·배포·운영 문서를 **폴더별**로 정리했습니다.

## 폴더 구조

```
docs/
├── README.md           ← 현재 문서 (목차)
├── design/             설계 (아키텍처·요구사항·API·DB·UI/UX + 인덱스)
├── deployment/         배포 (가이드·K8s·계획·SSL/HTTPS)
├── infra-dev/          인프라·개발 (MQ·모니터링·MSA·RDBMS·규약·환경·자동화)
└── project/            프로젝트 현황·보안·광고
```

## 목차

### design/ — 설계 문서

| 문서 | 설명 |
|------|------|
| [99_DESIGN_DOCUMENTS_INDEX.md](design/99_DESIGN_DOCUMENTS_INDEX.md) | **전체 설계서 목차** (의존성 포함) |
| [01_SYSTEM_ARCHITECTURE.md](design/01_SYSTEM_ARCHITECTURE.md) | 시스템 아키텍처 |
| [02_REQUIREMENTS.md](design/02_REQUIREMENTS.md) | 요구사항 명세서 |
| [03_API_SPECIFICATION.md](design/03_API_SPECIFICATION.md) | API 명세서 |
| [04_DATABASE_DESIGN.md](design/04_DATABASE_DESIGN.md) | 데이터베이스 설계서 |
| [05_UI_UX_DESIGN.md](design/05_UI_UX_DESIGN.md) | UI/UX 설계서 |

### deployment/ — 배포

| 문서 | 설명 |
|------|------|
| [06_DEPLOYMENT_GUIDE.md](deployment/06_DEPLOYMENT_GUIDE.md) | 배포 가이드 (NAS·클라우드) |
| [07_KUBERNETES_DEPLOYMENT.md](deployment/07_KUBERNETES_DEPLOYMENT.md) | Kubernetes 배포 |

**로컬 전용** (Git 제외, `.gitignore`): `DEPLOYMENT_PLAN.md`, `SSL_HTTPS_SETUP.md` — 배포 계획·SSL/HTTPS·인증서 갱신은 로컬 참고용으로만 유지합니다.

### infra-dev/ — 인프라·개발 환경

| 문서 | 설명 |
|------|------|
| [08_MQ_KAFKA_GUIDE.md](infra-dev/08_MQ_KAFKA_GUIDE.md) | MQ/Kafka 가이드 |
| [09_SPRING_MONITORING.md](infra-dev/09_SPRING_MONITORING.md) | Spring 모니터링 |
| [10_MSA_ARCHITECTURE.md](infra-dev/10_MSA_ARCHITECTURE.md) | MSA 아키텍처 |
| [11_RDBMS_RECOMMENDATION.md](infra-dev/11_RDBMS_RECOMMENDATION.md) | RDBMS 선택 가이드 |
| [12_CODING_CONVENTIONS.md](infra-dev/12_CODING_CONVENTIONS.md) | 코딩 규약 |
| [13_BACKEND_ENVIRONMENT_SETUP.md](infra-dev/13_BACKEND_ENVIRONMENT_SETUP.md) | 백엔드 환경 설정 |
| [14_AUTOMATION.md](infra-dev/14_AUTOMATION.md) | 자동화 (CI·로컬 검사) |
| [15_JENKINS_AND_MONITORING.md](infra-dev/15_JENKINS_AND_MONITORING.md) | Jenkins·모니터링 |

### project/ — 프로젝트 현황·보안

| 문서 | 설명 |
|------|------|
| [FEATURE_PROGRESS.md](project/FEATURE_PROGRESS.md) | 기능별 진행 현황 |
| [SECURITY_CHECKLIST.md](project/SECURITY_CHECKLIST.md) | 보안 점검 체크리스트 |
| [ADSENSE_SAFETY.md](project/ADSENSE_SAFETY.md) | AdSense 광고 필터(부적절한 광고 차단) |
| [GIT_IGNORE_GUIDE.md](project/GIT_IGNORE_GUIDE.md) | Git에 올리지 않을 항목 분류 |

## 백엔드 전용

- [../backend/](../backend/) — README, SETUP_GUIDE, DATABASE_SETUP, CHECK_OAUTH_CONFIG, RUN.md
