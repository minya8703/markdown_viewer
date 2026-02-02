# 설계 문서 인덱스

## 개요
이 문서는 마크다운 뷰어 V2 프로젝트의 모든 설계 문서에 대한 인덱스입니다.

## 문서 구조

### 99. 설계 문서 인덱스 (목차)
- **파일**: `99_DESIGN_DOCUMENTS_INDEX.md`
- **내용**: 모든 설계 문서의 목록 및 의존성 관리
- **상태**: ✅ 완료

### 01. 시스템 아키텍처
- **파일**: `01_SYSTEM_ARCHITECTURE.md`
- **내용**: 전체 시스템 아키텍처, 컴포넌트 구성, 데이터 흐름, 기술 스택
- **상태**: ✅ 완료

### 02. 요구사항 명세서
- **파일**: `02_REQUIREMENTS.md`
- **내용**: 기능 요구사항, 비기능 요구사항, 사용자 스토리
- **상태**: ✅ 완료

### 03. API 명세서
- **파일**: `03_API_SPECIFICATION.md`
- **내용**: REST API 엔드포인트 상세 정의, 요청/응답 스키마
- **상태**: ✅ 완료

### 04. 데이터베이스 설계서
- **파일**: `04_DATABASE_DESIGN.md`
- **내용**: 데이터베이스 스키마, 테이블 구조, 관계도
- **상태**: ✅ 완료

### 05. UI/UX 설계서
- **파일**: `05_UI_UX_DESIGN.md`
- **내용**: 화면 설계, 사용자 인터페이스, 사용자 경험 흐름
- **상태**: ✅ 완료

### 06. 배포 가이드
- **파일**: `06_DEPLOYMENT_GUIDE.md`
- **내용**: NAS 배포 절차, 클라우드 전환 가이드, 운영 가이드
- **상태**: ✅ 완료

### 07. Kubernetes 배포 가이드
- **파일**: `07_KUBERNETES_DEPLOYMENT.md`
- **내용**: Kubernetes 클러스터 구성, 배포, 오토스케일링, 모니터링
- **상태**: ✅ 완료

### 08. MQ/Kafka 가이드
- **파일**: `08_MQ_KAFKA_GUIDE.md`
- **내용**: RabbitMQ/Kafka 비동기 처리, 이벤트 스트리밍, 모니터링
- **상태**: ✅ 완료

### 09. Spring 모니터링 가이드
- **파일**: `09_SPRING_MONITORING.md`
- **내용**: Spring Boot Actuator, Micrometer, Prometheus, Custom Metrics, Distributed Tracing, Grafana
- **상태**: ✅ 완료

### 10. MSA 아키텍처 가이드
- **파일**: `10_MSA_ARCHITECTURE.md`
- **내용**: 작은 프로젝트에서 MSA 적용 전략, 서비스 분리, API Gateway, 서비스 간 통신
- **상태**: ✅ 완료

### 11. RDBMS 선택 가이드
- **파일**: `11_RDBMS_RECOMMENDATION.md`
- **내용**: 프로젝트 특성에 맞는 RDBMS 선택 및 구성 가이드 (MariaDB 권장)
- **상태**: ✅ 완료

### 12. 코딩 규약 및 스타일 가이드
- **파일**: `12_CODING_CONVENTIONS.md`
- **내용**: TypeScript 코딩 규약, FSD 아키텍처 규칙, 네이밍 컨벤션, 코드 스타일, 커밋 메시지 규칙
- **상태**: ✅ 완료

### 13. 백엔드 환경 설정 가이드
- **파일**: `13_BACKEND_ENVIRONMENT_SETUP.md`
- **내용**: Google OAuth2 설정, 데이터베이스 설정, 환경 변수 설정, JWT Secret 생성, 문제 해결
- **상태**: ✅ 완료

## 문서 작성 순서

1. ✅ 01. 시스템 아키텍처 (완료)
2. ✅ 02. 요구사항 명세서 (완료)
3. ✅ 03. API 명세서 (완료)
4. ✅ 04. 데이터베이스 설계서 (완료)
5. ✅ 05. UI/UX 설계서 (완료)
6. ✅ 06. 배포 가이드 (완료)
7. ✅ 07. Kubernetes 배포 가이드 (완료)
8. ✅ 08. MQ/Kafka 가이드 (완료)
9. ✅ 09. Spring 모니터링 가이드 (완료)
10. ✅ 10. MSA 아키텍처 가이드 (완료)
11. ✅ 11. RDBMS 선택 가이드 (완료)
12. ✅ 12. 코딩 규약 및 스타일 가이드 (완료)
13. ✅ 13. 백엔드 환경 설정 가이드 (완료)

## 문서 간 의존성

```
99. 99_DESIGN_DOCUMENTS_INDEX.md (목차)
    │
    └── 01. 01_SYSTEM_ARCHITECTURE.md
            ├── 02. 02_REQUIREMENTS.md (기반)
            ├── 03. 03_API_SPECIFICATION.md (기반)
            ├── 04. 04_DATABASE_DESIGN.md (기반)
            ├── 05. 05_UI_UX_DESIGN.md (기반)
            ├── 06. 06_DEPLOYMENT_GUIDE.md (기반)
            ├── 07. 07_KUBERNETES_DEPLOYMENT.md (기반)
            ├── 08. 08_MQ_KAFKA_GUIDE.md (기반)
            ├── 09. 09_SPRING_MONITORING.md (기반)
            ├── 10. 10_MSA_ARCHITECTURE.md (기반)
            ├── 11. 11_RDBMS_RECOMMENDATION.md (기반)
            ├── 12. 12_CODING_CONVENTIONS.md (기반)
            └── 13. 13_BACKEND_ENVIRONMENT_SETUP.md (기반)
```

### 문서 번호 체계
- **99**: 목차 (`99_DESIGN_DOCUMENTS_INDEX.md`)
- **01**: 시스템 아키텍처 (`01_SYSTEM_ARCHITECTURE.md`) - 최상위 문서
- **02**: 요구사항 명세서 (`02_REQUIREMENTS.md`)
- **03**: API 명세서 (`03_API_SPECIFICATION.md`)
- **04**: 데이터베이스 설계서 (`04_DATABASE_DESIGN.md`)
- **05**: UI/UX 설계서 (`05_UI_UX_DESIGN.md`)
- **06**: 배포 가이드 (`06_DEPLOYMENT_GUIDE.md`)
- **07**: Kubernetes 배포 가이드 (`07_KUBERNETES_DEPLOYMENT.md`)
- **08**: MQ/Kafka 가이드 (`08_MQ_KAFKA_GUIDE.md`)
- **09**: Spring 모니터링 가이드 (`09_SPRING_MONITORING.md`)
- **10**: MSA 아키텍처 가이드 (`10_MSA_ARCHITECTURE.md`)
- **11**: RDBMS 선택 가이드 (`11_RDBMS_RECOMMENDATION.md`)
- **12**: 코딩 규약 및 스타일 가이드 (`12_CODING_CONVENTIONS.md`)
- **13**: 백엔드 환경 설정 가이드 (`13_BACKEND_ENVIRONMENT_SETUP.md`)

## 참고 사항

- **99번 문서**는 모든 설계 문서의 목차 및 인덱스 역할을 합니다.
- **01번 문서** (시스템 아키텍처)는 최상위 문서로, 다른 모든 문서의 기반이 됩니다.
- **02-06번 문서**는 시스템 아키텍처를 기반으로 작성된 상세 설계 문서입니다.
- 각 설계서는 독립적으로 읽을 수 있도록 충분한 컨텍스트를 포함합니다.
- 설계 변경 시 관련 문서들을 함께 업데이트해야 합니다.
- 문서 번호는 문서 간 의존성과 참조를 쉽게 파악하기 위한 것입니다.
