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

### 백엔드 (예정)
- **프레임워크**: Spring Boot 3.x
- **인증**: Spring Security, JWT
- **데이터베이스**: MariaDB 10.11 (권장) / PostgreSQL (대안)
- **마크다운 처리**: Flexmark-java, CommonMark
- **메시지 큐**: RabbitMQ 또는 Kafka
- **캐싱**: Redis Cluster, Caffeine
- **모니터링**: Prometheus, Grafana, ELK Stack

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
├── 01_SYSTEM_ARCHITECTURE.md    # 시스템 아키텍처 설계서
├── 02_REQUIREMENTS.md           # 요구사항 명세서
├── 03_API_SPECIFICATION.md      # API 명세서
├── 04_DATABASE_DESIGN.md        # 데이터베이스 설계서
├── 05_UI_UX_DESIGN.md           # UI/UX 설계서
├── 06_DEPLOYMENT_GUIDE.md       # 배포 가이드
├── 07_KUBERNETES_DEPLOYMENT.md  # Kubernetes 배포 가이드
├── 08_MQ_KAFKA_GUIDE.md         # MQ/Kafka 비동기 처리 가이드
├── 09_SPRING_MONITORING.md      # Spring 모니터링 가이드
├── 10_MSA_ARCHITECTURE.md       # MSA 아키텍처 가이드
├── 11_RDBMS_RECOMMENDATION.md   # RDBMS 선택 가이드
├── 12_CODING_CONVENTIONS.md     # 코딩 규약 및 스타일 가이드
└── 99_DESIGN_DOCUMENTS_INDEX.md # 설계 문서 인덱스
```

## 시작하기

### 프론트엔드 개발

```bash
cd frontend
npm install
npm run dev
```

개발 서버는 `http://localhost:3000`에서 실행됩니다.

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

> 💡 **코딩 규약**: 프로젝트의 코딩 스타일과 규칙은 [코딩 규약 및 스타일 가이드](./12_CODING_CONVENTIONS.md)를 참고하세요.

## 문서

자세한 설계 문서는 다음을 참고하세요:

- [시스템 아키텍처](./01_SYSTEM_ARCHITECTURE.md)
- [요구사항 명세서](./02_REQUIREMENTS.md)
- [API 명세서](./03_API_SPECIFICATION.md)
- [데이터베이스 설계서](./04_DATABASE_DESIGN.md)
- [UI/UX 설계서](./05_UI_UX_DESIGN.md)
- [배포 가이드](./06_DEPLOYMENT_GUIDE.md)
- [Kubernetes 배포 가이드](./07_KUBERNETES_DEPLOYMENT.md)
- [MQ/Kafka 가이드](./08_MQ_KAFKA_GUIDE.md)
- [Spring 모니터링 가이드](./09_SPRING_MONITORING.md)
- [MSA 아키텍처 가이드](./10_MSA_ARCHITECTURE.md)
- [RDBMS 선택 가이드](./11_RDBMS_RECOMMENDATION.md)
- [코딩 규약 및 스타일 가이드](./12_CODING_CONVENTIONS.md)
- [설계 문서 인덱스](./99_DESIGN_DOCUMENTS_INDEX.md)

## 라이선스

이 프로젝트는 [MIT License](LICENSE) 하에 배포됩니다.

Copyright (c) 2026 Markdown Viewer V2
