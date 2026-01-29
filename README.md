# Markdown Viewer V2

Google 로그인 기반의 안전하고 사용하기 편한 마크다운 뷰어 및 에디터

## 프로젝트 개요

마크다운 뷰어 V2는 개인 파일의 프라이버시를 보호하면서도 직관적이고 편안한 사용자 경험을 제공하는 웹 기반 마크다운 뷰어 및 에디터입니다.

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
- **데이터베이스**: SQLite (초기) / PostgreSQL (확장)
- **마크다운 처리**: Flexmark-java, CommonMark

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

## 문서

자세한 설계 문서는 다음을 참고하세요:

- [시스템 아키텍처](./01_SYSTEM_ARCHITECTURE.md)
- [요구사항 명세서](./02_REQUIREMENTS.md)
- [API 명세서](./03_API_SPECIFICATION.md)
- [데이터베이스 설계서](./04_DATABASE_DESIGN.md)
- [UI/UX 설계서](./05_UI_UX_DESIGN.md)
- [배포 가이드](./06_DEPLOYMENT_GUIDE.md)
- [설계 문서 인덱스](./99_DESIGN_DOCUMENTS_INDEX.md)

## 라이선스

이 프로젝트는 [MIT License](LICENSE) 하에 배포됩니다.

Copyright (c) 2026 Markdown Viewer V2
