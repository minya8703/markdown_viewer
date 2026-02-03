# Markdown Viewer V2 - Frontend

## 프로젝트 개요

마크다운 뷰어 V2의 프론트엔드 애플리케이션입니다.

## 핵심 개발 원칙

### 1. UX/UI 우선
- 직관적이고 매력적인 화면 구성
- 퍼블리싱 및 반응형 디자인 고려
- Content First 접근

### 2. 성능 최적화
- 브라우저 개발자 도구를 활용한 렌더링 최적화
- 필요 시에만 최적화 적용
- 코드 스플리팅 및 지연 로딩

### 3. 유지보수 가능한 아키텍처
- **Feature-Sliced Design (FSD)** 구조 적용
- 관심사의 분리 원칙 준수
- 코드 복잡성 관리

### 4. 안정성과 확장성
- **TypeScript 필수** 사용
- 타입 안정성 보장
- 확장 가능한 구조

### 5. 개발자 경험 (DX)
- 읽기 좋은 깔끔한 코드
- 백엔드 API와의 효율적인 연동
- 상태 관리 최적화

### 6. 크로스 브라우징
- 다양한 브라우저 및 OS 환경 지원
- 최신 웹 표준 준수

## 프로젝트 구조 (FSD)

```
frontend/
├── src/
│   ├── app/              # 애플리케이션 진입점 및 초기화
│   ├── pages/           # 페이지 레벨 컴포넌트
│   ├── widgets/         # 복합 UI 블록 (Header, Sidebar 등)
│   ├── features/        # 비즈니스 기능 (로그인, 파일 관리 등)
│   ├── entities/        # 비즈니스 엔티티 (User, File 등)
│   └── shared/         # 공유 코드
│       ├── api/         # API 클라이언트
│       ├── lib/         # 유틸리티 라이브러리
│       ├── styles/      # 전역 스타일
│       ├── types/       # 타입 정의
│       └── ui/          # 공유 UI 컴포넌트
├── public/              # 정적 파일
├── package.json
├── tsconfig.json
├── vite.config.ts
└── index.html
```

## 기술 스택

- **언어**: TypeScript 5.2+
- **빌드 도구**: Vite 5.0+
- **스타일**: CSS3 (Variables, Grid, Flexbox)
- **라이브러리**:
  - Highlight.js (코드 하이라이팅)
  - Font Awesome (아이콘)
- **Web APIs**:
  - Page Visibility API
  - File System Access API (선택적)
  - Web Crypto API (암호화)

## 시작하기

### 설치

```bash
npm install
```

### 개발 서버 실행

```bash
npm run dev
```

개발 서버는 `http://localhost:3000`에서 실행됩니다.

### 빌드

```bash
npm run build
```

빌드 결과물은 `dist/` 디렉토리에 생성됩니다.

### 타입 체크

```bash
npm run type-check
```

### 린트

```bash
npm run lint
```

## 환경 변수

`.env` 파일을 생성하여 다음 변수를 설정할 수 있습니다. (예시: `.env.example` 참고)

```env
VITE_API_BASE_URL=http://localhost:8080/api
# Google AdSense (푸터 광고 영역 표시)
VITE_ADSENSE_CLIENT_ID=ca-pub-6630536104334142
```

## 개발 가이드

### FSD 구조 규칙

1. **app**: 애플리케이션 초기화 및 진입점만 포함
2. **pages**: 라우트별 페이지 컴포넌트
3. **widgets**: 여러 features를 조합한 복합 컴포넌트
4. **features**: 독립적인 비즈니스 기능
5. **entities**: 비즈니스 엔티티 및 관련 로직
6. **shared**: 모든 레이어에서 공유하는 코드

### 레이어 간 의존성 규칙

- 상위 레이어는 하위 레이어만 import 가능
- 같은 레이어 내에서는 import 불가
- shared는 모든 레이어에서 import 가능

예시:
- `pages` → `widgets`, `features`, `entities`, `shared` ✅
- `features` → `entities`, `shared` ✅
- `features` → `widgets` ❌ (같은 레이어)
- `shared` → 다른 레이어 ❌

## 주요 기능

- ✅ Google OAuth 로그인
- ✅ 마크다운 뷰어
- ✅ 파일 편집기
- ✅ 자동 저장
- ✅ 파일 암호화 (클라이언트 사이드)
- ✅ 로컬 파일 읽기/저장
- ✅ 백그라운드 업데이트 방지
- ✅ 반응형 디자인

## 브라우저 지원

- Chrome/Edge (최신 2개 버전)
- Firefox (최신 2개 버전)
- Safari (최신 2개 버전)
- 모바일 브라우저 지원

## 라이선스

MIT
