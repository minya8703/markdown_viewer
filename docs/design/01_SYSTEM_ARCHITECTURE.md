# 시스템 아키텍처 구성도

## 목차
1. [시스템 개요](#시스템-개요)
2. [사용자 시나리오](#사용자-시나리오)
3. [아키텍처 레이어](#아키텍처-레이어)
4. [컴포넌트 구성도](#컴포넌트-구성도)
5. [데이터 흐름도](#데이터-흐름도)
6. [기술 스택 구성](#기술-스택-구성)
7. [파일 보안 및 암호화](#파일-보안-및-암호화)
8. [배포 구조](#배포-구조)
9. [확장성 전략](#확장성-전략)

---

## 시스템 개요

### 프로젝트 목표
- **단일 화면 마크다운 뷰어**: 파일을 열면 즉시 마크다운 콘텐츠에 집중
- **Google 로그인 기반**: Google OAuth를 통한 사용자 인증 및 사용자별 폴더 관리
- **멀티테넌트 구조**: 사용자별 독립적인 폴더 구조로 데이터 격리
- **NAS 우선 배포**: 초기 배포는 홈 NAS, 향후 클라우드 전환 가능
- **수익화**: Google AdSense를 통한 광고 수익
- **확장성**: 하루 1000명 이상 사용자 지원, 최대 5000명까지 확장 가능
- **UX/UI**: 직관적인 아이콘 기반 인터페이스, 매우 편안한 사용자 경험

### 학습 및 경험 목표
이 프로젝트는 **실무에서 요구되는 핵심 기술 스택을 경험**하기 위한 학습 프로젝트입니다:
- **MSA (Microservices Architecture)**: 작은 프로젝트에서도 MSA 패턴 적용 및 경험
- **Kubernetes**: 컨테이너 오케스트레이션 및 마이크로서비스 배포 경험
- **비동기 처리**: MQ (RabbitMQ) 또는 Kafka를 활용한 스트림 처리 및 이벤트 기반 아키텍처
- **캐싱 전략**: 다양한 캐싱 레이어 (L1/L2 캐시, 분산 캐시, CDN) 설계 및 구현
- **대용량 트래픽 대응**: 로드 밸런싱, 오토스케일링, 데이터베이스 샤딩, 성능 최적화
- **모니터링 및 관찰성**: 메트릭, 로깅, 트레이싱을 통한 시스템 가시성 확보

### 핵심 기능
1. **Google 로그인**: Google OAuth 2.0을 통한 사용자 인증
2. **사용자별 폴더 관리**: 각 사용자마다 독립적인 폴더 구조 (`/users/{userId}/`)
3. **마크다운 뷰어**: 파일 열기 시 즉시 렌더링된 콘텐츠 표시
4. **편집 기능**: 선택적 편집 모드 (더블클릭 또는 아이콘 클릭)
5. **Smart Paste**: 붙여넣기 시 마크다운 형식 자동 인식 및 렌더링
6. **파일 관리**: 사용자 자신의 폴더 내에서 파일 관리 (URL 파라미터 또는 드래그앤드롭)
7. **세션 관리**: JWT 또는 세션 기반 사용자 인증 상태 유지
8. **광고 통합**: Google AdSense 광고 표시
9. **백그라운드 업데이트 방지**: 탭이 비활성화되어 있을 때 자동 새로고침 및 파일 변경 감지 중지
10. **마지막 문서 자동 로드**: 로그인 후 마지막으로 수정하던 문서 자동 로드
11. **자동 저장**: 편집 중 주기적으로 자동 저장 (로컬 임시 저장 + 서버 저장)
12. **로컬 파일 관리**: 컴퓨터의 로컬 파일 읽기/저장 기능
13. **파일 암호화**: 클라이언트 사이드 암호화로 개인 파일 보호
14. **로컬 전용 모드**: 서버에 저장하지 않고 로컬에서만 작업 가능
15. **파일 삭제 옵션**: 서버에서 완전 삭제 또는 안전 삭제 옵션

---

## 사용자 시나리오

### 전체 사용자 흐름

```
[사용자가 웹사이트 접속]
  │
  ▼
[로그인 페이지]
  │
  ├─ 1a. "Google로 로그인" 버튼 클릭
  │       │
  │       ▼
  │   [Google OAuth 인증]
  │
  └─ 1b. "로그인 없이 뷰어 시작" 버튼 클릭
          │
          ▼
      [뷰어 화면 (비로그인)] → 로컬 파일 열기/저장만 가능, 사용자 아이콘 클릭 시 로그인 페이지로
  │
  │ (1a 선택 시)
  ▼
[Google OAuth 인증]
  │
  │ 2. Google 계정으로 로그인
  │
  ▼
[인증 완료, 메인 페이지로 리다이렉트]
  │
  │ 3. 마지막 수정 문서 자동 로드
  │    - localStorage에서 마지막 문서 경로 확인
  │    - 또는 서버에서 마지막 수정 문서 정보 조회
  │
  ▼
[메인 뷰어 화면]
  │
  ├─ [마지막 문서가 있으면]
  │   └─► [해당 문서 자동 로드 및 표시]
  │
  └─ [마지막 문서가 없으면]
      └─► [빈 화면 또는 파일 선택 안내]
  │
  │ 4. 사용자 작업 옵션:
  │
  ├─ [폴더/파일 관리 창 열기]
  │   │
  │   └─► [사이드바 또는 모달로 파일 목록 표시]
  │       │
  │       └─► [파일 선택 시 해당 파일 로드]
  │
  ├─ [로컬 파일 읽기]
  │   │
  │   └─► [파일 선택 다이얼로그]
  │       │
  │       └─► [로컬 파일 읽어서 뷰어에 표시]
  │
  └─ [새 문서 생성]
      │
      └─► [빈 편집기 열기]
  │
  │ 5. 문서 편집 시작
  │    - 더블클릭 또는 편집 아이콘 클릭
  │
  ▼
[편집 모드]
  │
  │ 6. 자동 저장 시작
  │    - localStorage에 임시 저장 (즉시)
  │    - 서버에 주기적 저장 (예: 3분마다)
  │
  │ 7. 편집 중...
  │    - 타이핑, 붙여넣기 등
  │    - 변경사항은 localStorage에 즉시 저장
  │
  │ 8. 자동 저장 실행 (3분마다)
  │    - 변경사항이 있으면 서버에 저장
  │    - 저장 성공 시 localStorage의 변경 플래그 초기화
  │
  │ 9. 필요시 수동 저장
  │    - Ctrl+S 또는 저장 버튼
  │    - 즉시 서버에 저장
  │
  │ 10. 로컬 파일로 저장 (선택적)
  │     - "로컬에 저장" 버튼 클릭
  │     - 브라우저 다운로드 또는 File System Access API 사용
  │
  │ 11. 편집 종료
  │     - "닫기" 버튼 또는 ESC 키
  │     - 저장되지 않은 변경사항 확인
  │     - 확인 후 뷰어 모드로 전환
  │
  ▼
[뷰어 모드]
  │
  │ 12. 다른 파일 선택 또는 로그아웃
  │
  ▼
[종료 또는 다음 작업]
```

### 주요 기능 상세

#### 1. 마지막 문서 자동 로드

**구현 방법:**
- **localStorage 사용**: 브라우저에 마지막 문서 경로 저장
- **서버 메타데이터**: 사용자의 마지막 수정 문서 정보를 DB에 저장

**우선순위:**
1. localStorage의 `lastDocumentPath` 확인
2. 없으면 서버 API 호출: `GET /api/users/me/last-document`
3. 둘 다 없으면 빈 화면 표시

#### 2. 폴더 및 파일 관리 창

**UI 구성:**
- 사이드바 또는 모달 형태
- 폴더 트리 구조 표시
- 파일 목록 (이름, 수정일, 크기)
- 검색 기능
- 새 파일/폴더 생성

**기능:**
- 파일 클릭 시 즉시 로드
- 드래그앤드롭으로 파일 열기
- 컨텍스트 메뉴 (삭제, 이름 변경 등)

#### 3. 자동 저장 메커니즘

**Redis 사용에 대한 답변:**
❌ **Redis는 자동 저장에 적합하지 않습니다.**

**이유:**
- 자동 저장은 **사용자별 로컬 상태**이므로 프론트엔드에서 관리하는 것이 적합
- Redis는 **서버 측 공유 상태** 관리에 사용 (캐싱, 세션 등)
- 자동 저장은 브라우저의 **localStorage**에 임시 저장 후 주기적으로 서버에 저장

**권장 구조:**
```
[편집 중]
  │
  │ 변경사항 발생
  │
  ▼
[localStorage에 즉시 저장]
  - 키: "draft_{filePath}"
  - 값: { content: "...", timestamp: "..." }
  │
  │ (3분마다 또는 변경사항 누적 시)
  │
  ▼
[서버에 저장]
  POST /api/files/{path}
  Body: { content: "..." }
  │
  │
  ▼
[서버 응답 성공]
  - localStorage의 변경 플래그 초기화
  - 마지막 저장 시간 업데이트
```

**Redis의 올바른 사용처:**
- ✅ 마크다운 렌더링 결과 캐싱
- ✅ 파일 메타데이터 캐싱
- ✅ 세션 관리 (선택적)
- ✅ 분산 환경에서 공유 캐시

#### 4. 로컬 파일 읽기/저장

**읽기:**
- HTML5 File API 사용
- `<input type="file">` 또는 File System Access API
- 파일 내용을 읽어서 뷰어에 표시
- 서버에 업로드하지 않고 로컬에서만 작업 가능

**저장:**
- 브라우저 다운로드: `Blob` + `URL.createObjectURL()`
- File System Access API (Chrome/Edge): 직접 파일 시스템에 저장
- 서버 저장 후 다운로드

#### 5. 편집 종료 흐름

**닫기 버튼 클릭 시:**
1. 변경사항 확인
   - localStorage에 저장된 변경사항이 있는지 확인
   - 서버와 동기화되지 않은 변경사항 확인

2. 사용자 확인
   - 변경사항이 있으면: "저장하지 않은 변경사항이 있습니다. 저장하시겠습니까?"
   - 옵션: 저장 후 닫기 / 저장하지 않고 닫기 / 취소

3. 정리 작업
   - localStorage의 임시 저장 데이터 정리 (선택적)
   - 마지막 문서 경로 업데이트
   - 뷰어 모드로 전환

### 시나리오 흐름도

```
┌─────────────────────────────────────────────────────────┐
│                    웹사이트 접속                        │
└────────────────────┬──────────────────────────────────┘
                     │
                     ▼
            ┌─────────────────┐
            │  로그인 페이지  │
            └────────┬────────┘
                     │
                     ▼
            ┌─────────────────┐
            │ Google 로그인   │
            └────────┬────────┘
                     │
                     ▼
        ┌────────────────────────┐
        │  인증 완료, 메인 페이지 │
        └────────┬───────────────┘
                 │
                 ▼
    ┌────────────────────────────┐
    │ 마지막 문서 자동 로드      │
    │ - localStorage 확인        │
    │ - 서버 API 호출 (없으면)   │
    └────────┬───────────────────┘
             │
    ┌────────┴────────┐
    │                 │
    ▼                 ▼
[문서 있음]    [문서 없음]
    │                 │
    │                 └─► [빈 화면]
    │
    ▼
┌───────────────────────────────┐
│     메인 뷰어 화면            │
│  ┌─────────────────────────┐ │
│  │  [마크다운 콘텐츠 표시]  │ │
│  └─────────────────────────┘ │
│  ┌─────────────────────────┐ │
│  │ [파일 관리] [로컬 파일]  │ │
│  └─────────────────────────┘ │
└───────────┬───────────────────┘
            │
    ┌───────┴───────┐
    │               │
    ▼               ▼
[파일 관리 창]  [로컬 파일]
    │               │
    │               └─► [파일 선택]
    │                   │
    │                   ▼
    │           [로컬 파일 읽기]
    │                   │
    │                   ▼
    └───────────► [뷰어에 표시]
                    │
                    ▼
            ┌───────────────┐
            │  편집 모드    │
            └───────┬───────┘
                    │
        ┌───────────┼───────────┐
        │           │           │
        ▼           ▼           ▼
  [자동 저장]  [수동 저장]  [로컬 저장]
  (3분마다)   (Ctrl+S)    (다운로드)
        │           │           │
        └───────────┴───────────┘
                    │
                    ▼
            ┌───────────────┐
            │  닫기 버튼    │
            └───────┬───────┘
                    │
                    ▼
            ┌───────────────┐
            │ 변경사항 확인 │
            └───────┬───────┘
                    │
        ┌───────────┼───────────┐
        │           │           │
        ▼           ▼           ▼
  [저장 후 닫기] [저장 안함]  [취소]
        │           │           │
        └───────────┴───────────┘
                    │
                    ▼
            ┌───────────────┐
            │  뷰어 모드    │
            └───────────────┘
```

### 개선 제안 사항

#### 1. 자동 저장 개선
- ✅ **localStorage 사용**: 즉시 저장, 오프라인 지원
- ✅ **서버 저장**: 주기적으로 (3분) 또는 변경사항 누적 시
- ✅ **저장 상태 표시**: "자동 저장됨" / "저장 중..." / "저장 실패"
- ❌ **Redis 사용 안 함**: 자동 저장은 프론트엔드에서 관리

#### 2. 마지막 문서 관리
- localStorage와 서버 DB 모두 사용
- localStorage: 빠른 접근, 브라우저별
- 서버 DB: 모든 기기에서 동일한 마지막 문서 접근 가능

#### 3. 로컬 파일 관리
- File System Access API 지원 (Chrome/Edge)
- 폴백: 일반 파일 다운로드
- 로컬 파일은 서버에 업로드하지 않고 로컬에서만 작업 가능

#### 4. 편집 종료 흐름
- 변경사항 확인 다이얼로그
- 자동 저장된 내용도 확인
- 페이지를 떠날 때도 확인 (beforeunload 이벤트)

---

## 아키텍처 레이어

### 모놀리식 아키텍처 (초기 단계)

```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Browser    │  │  Mobile Web  │  │   Tablet     │     │
│  │   (Desktop)  │  │   Browser    │  │   Browser    │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                 │                 │              │
│         └─────────────────┼─────────────────┘              │
│                           │                                │
│         ┌─────────────────▼─────────────────┐              │
│         │      Frontend (HTML/CSS/JS)       │              │
│         │  - Google OAuth Login             │              │
│         │  - Single Screen Viewer           │              │
│         │  - Icon-based UI                  │              │
│         │  - Smart Paste Handler            │              │
│         │  - Page Visibility Manager        │              │
│         │  - Session Management             │              │
│         │  - AdSense Integration            │              │
│         └─────────────────┬─────────────────┘              │
└───────────────────────────┼────────────────────────────────┘
                            │ HTTP/HTTPS
┌───────────────────────────▼────────────────────────────────┐
│                   Application Layer                         │
│  ┌──────────────────────────────────────────────────────┐ │
│  │           Web Server (Nginx/Tomcat)                  │ │
│  │  - Reverse Proxy                                     │ │
│  │  - Static File Serving                               │ │
│  │  - SSL Termination                                   │ │
│  └───────────────────────┬──────────────────────────────┘ │
│                          │                                │
│  ┌───────────────────────▼──────────────────────────────┐ │
│  │        Application Server (Spring Boot)              │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────┐  │ │
│  │  │   Auth       │  │   REST API   │  │  Markdown│  │ │
│  │  │  Controller  │  │  Controller  │  │ Processor│  │ │
│  │  └──────┬───────┘  └──────┬───────┘  └────┬─────┘  │ │
│  │         │                 │                │        │ │
│  │  ┌──────▼─────────────────▼────────────────▼──────┐ │ │
│  │  │            Service Layer                        │ │ │
│  │  │  - Auth Service (Google OAuth)                │ │ │
│  │  │  - User Service                               │ │ │
│  │  │  - File Service                                │ │ │
│  │  │  - Markdown Service                            │ │ │
│  │  │  - Cache Service                               │ │ │
│  │  │  - Message Queue Service (MQ/Kafka)          │ │ │
│  │  │  - Database Service (MariaDB)                │ │ │
│  │  └────────────────────────────────────────────────┘ │ │
│  │                                                      │ │
│  │  ┌────────────────────────────────────────────────┐ │ │
│  │  │      Async Processing Layer                     │ │ │
│  │  │  - File Upload Worker                         │ │ │
│  │  │  - Markdown Rendering Worker                  │ │ │
│  │  │  - Event Stream Processor                     │ │ │
│  │  └────────────────────────────────────────────────┘ │ │
│  │                                                      │ │
│  │  ┌────────────────────────────────────────────────┐ │ │
│  │  │         Security Layer                         │ │ │
│  │  │  - JWT Token Management                        │ │ │
│  │  │  - Session Management                          │ │ │
│  │  │  - Authorization Filter                        │ │ │
│  │  └────────────────────────────────────────────────┘ │ │
│  └───────────────────────┬──────────────────────────────┘ │
└───────────────────────────┼────────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────────┐
│                      Data Layer                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │   File       │  │    Cache     │  │   Database   │   │
│  │  System      │  │   (Redis)    │  │  (User Info) │   │
│  │  (NAS/Object │  │              │  │              │   │
│  │   Storage)   │  │              │  │ - User ID    │   │
│  │              │  │              │  │ - Email      │   │
│  │ /users/      │  │              │  │ - Created    │   │
│  │   {userId}/  │  │              │  │              │   │
│  │   files/     │  │              │  │              │   │
│  └──────────────┘  └──────────────┘  └──────────────┘   │
│                                                           │
│  ┌──────────────┐  ┌──────────────┐                      │
│  │  Message     │  │  Monitoring │                      │
│  │  Queue       │  │  & Logging  │                      │
│  │  (MQ/Kafka)  │  │  (Prometheus│                      │
│  │              │  │   /ELK)     │                      │
│  └──────────────┘  └──────────────┘                      │
│                                                           │
│  ┌─────────────────────────────────────────────────────┐ │
│  │              External Services                       │ │
│  │  - Google OAuth 2.0 API                             │ │
│  │  - Google AdSense                                   │ │
│  └─────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────┘
```

### MSA 아키텍처 (확장 단계)

```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Browser    │  │  Mobile Web  │  │   Tablet     │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         └─────────────────┼─────────────────┘              │
│                           │                                │
│         ┌─────────────────▼─────────────────┐              │
│         │      Frontend (TypeScript)        │              │
│         └─────────────────┬─────────────────┘              │
└───────────────────────────┼────────────────────────────────┘
                            │ HTTP/HTTPS
┌───────────────────────────▼────────────────────────────────┐
│                    API Gateway Layer                       │
│  ┌──────────────────────────────────────────────────────┐ │
│  │         Spring Cloud Gateway / Kong                  │ │
│  │  - 라우팅                                            │ │
│  │  - 인증/인가 (JWT 검증)                              │ │
│  │  - 로드 밸런싱                                       │ │
│  │  - Rate Limiting                                    │ │
│  │  - 로깅 및 모니터링                                  │ │
│  └───────────────────────┬──────────────────────────────┘ │
└───────────────────────────┼────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┬─────────────┐
        │                   │                   │             │
        ▼                   ▼                   ▼             ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Auth Service │  │ User Service │  │ File Service │  │Markdown      │
│              │  │              │  │              │  │Service       │
│ Port: 8081   │  │ Port: 8082   │  │ Port: 8083   │  │Port: 8084    │
│              │  │              │  │              │  │(Stateless)   │
└──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────────────┘
       │                 │                 │
       ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  Auth DB     │  │  User DB    │  │  File DB     │
│ (MariaDB)    │  │ (MariaDB)   │  │ (MariaDB)    │
└──────────────┘  └──────────────┘  └──────────────┘
       │                 │                 │
       └─────────────────┴─────────────────┘
                         │
                         ▼
            ┌────────────────────────┐
            │   Message Queue        │
            │  (RabbitMQ / Kafka)    │
            └────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ File Storage │  │   Redis      │  │  Monitoring  │
│ (Object/NFS) │  │  (Cache)     │  │ (Prometheus) │
└──────────────┘  └──────────────┘  └──────────────┘
```

**MSA 아키텍처 특징:**
- 각 서비스는 독립적으로 배포 및 스케일링 가능
- 서비스별 독립 데이터베이스 (Database per Service)
- API Gateway를 통한 단일 진입점
- 서비스 간 통신: REST API (동기) + Message Queue (비동기)
- 서비스 디스커버리: Kubernetes Service 또는 Eureka

**자세한 내용은 [MSA 아키텍처 가이드](./10_MSA_ARCHITECTURE.md) 참고**

---

## 컴포넌트 구성도

### 프론트엔드 컴포넌트

```
Frontend Application
│
├── Auth Component
│   ├── Google Login Button
│   ├── Login Page
│   ├── Session Manager
│   └── Token Storage (localStorage/sessionStorage)
│
├── Viewer Component (메인 화면)
│   ├── Header Section
│   │   ├── User Profile Display
│   │   ├── File Name Display
│   │   ├── Edit Icon Button
│   │   └── Settings Icon Button
│   │
│   ├── Content Section
│   │   ├── Markdown Renderer
│   │   │   ├── HTML Renderer
│   │   │   ├── Code Highlighter (Highlight.js)
│   │   │   └── Style Processor
│   │   │
│   │   └── Editor (Optional, Full-screen)
│   │       ├── Textarea Editor
│   │       ├── Smart Paste Handler
│   │       └── Save Button
│   │
│   └── Footer Section
│       └── AdSense Container
│
├── File Handler Component
│   ├── User Folder Navigator
│   ├── URL Parameter Parser
│   ├── Drag & Drop Handler
│   └── File Open Dialog
│
├── Auto Save Manager Component
│   ├── LocalStorage Manager
│   ├── Auto Save Timer (3분 간격)
│   ├── Change Detector
│   └── Save Status Indicator
│
├── Last Document Manager Component
│   ├── LocalStorage Handler
│   ├── Server API Client
│   └── Document Loader
│
├── File Manager Component
│   ├── Folder Tree Navigator
│   ├── File List Display
│   ├── File Search
│   └── Context Menu Handler
│
├── Local File Handler Component
│   ├── File Reader (File API)
│   ├── File System Access API Handler
│   └── File Download Manager
│
├── Encryption Component
│   ├── Encryption Manager
│   │   ├── AES-256-GCM Encryptor
│   │   ├── AES-256-GCM Decryptor
│   │   └── Key Derivation (PBKDF2)
│   ├── Password Manager
│   │   ├── Password Input Handler
│   │   ├── Password Storage (localStorage, encrypted)
│   │   └── Password Validation
│   └── Encryption UI
│       ├── Encryption Mode Selector
│       ├── Password Input Dialog
│       └── Encryption Status Indicator
│
├── Visibility Manager Component
│   ├── Page Visibility API Handler
│   ├── Auto-refresh Controller
│   └── File Change Detector
│
└── UI Component Library
    ├── Icon System (Font Awesome)
    ├── Toast Notification
    ├── Loading Indicator
    └── Confirmation Dialog
```

### 백엔드 컴포넌트

```
Spring Boot Application
│
├── Controller Layer
│   ├── AuthController
│   │   ├── GET  /api/auth/google/login      - Google 로그인 시작
│   │   ├── GET  /api/auth/google/callback   - Google OAuth 콜백
│   │   ├── GET  /api/auth/logout            - 로그아웃
│   │   └── GET  /api/auth/me                - 현재 사용자 정보
│   │
│   ├── UserController
│   │   └── GET  /api/users/me/last-document  - 마지막 수정 문서 조회
│   │
│   ├── FileController
│   │   ├── GET  /api/files                  - 사용자 파일 목록
│   │   ├── GET  /api/files/{path}           - 파일 읽기
│   │   ├── GET  /api/files/{path}/check     - 파일 변경 감지
│   │   ├── POST /api/files                  - 파일 저장
│   │   └── POST /api/files/upload           - 파일 업로드
│   │
│   ├── MarkdownController
│   │   ├── POST /api/markdown/render  - 마크다운 렌더링
│   │   └── POST /api/markdown/detect  - 마크다운 형식 감지
│   │
│   └── HealthController
│       └── GET  /api/health           - 헬스 체크
│
├── Service Layer
│   ├── AuthService
│   │   ├── authenticateWithGoogle(code)
│   │   ├── createOrUpdateUser(googleUserInfo)
│   │   ├── generateToken(userId)
│   │   └── validateToken(token)
│   │
│   ├── UserService
│   │   ├── getUserById(userId)
│   │   ├── getUserByEmail(email)
│   │   ├── createUserFolder(userId)
│   │   ├── getUserFolderPath(userId)
│   │   └── getLastModifiedDocument(userId)
│   │
│   ├── FileService
│   │   ├── listUserFiles(userId, path)
│   │   ├── readFile(userId, path)
│   │   ├── readEncryptedFile(userId, path)
│   │   ├── checkFileModified(userId, path, lastModified)
│   │   ├── saveFile(userId, path, content)
│   │   ├── saveEncryptedFile(userId, path, encryptedData, iv, tag)
│   │   ├── uploadFile(userId, file)
│   │   ├── validateFile(userId, path)
│   │   └── secureDelete(userId, path)
│   │
│   ├── MarkdownService
│   │   ├── renderMarkdown(content)
│   │   ├── detectMarkdownFormat(text)
│   │   └── processSmartPaste(text)
│   │
│   └── CacheService
│       ├── get(key)
│       ├── put(key, value, ttl)
│       └── invalidate(key)
│
├── Repository Layer
│   ├── UserRepository
│   │   ├── findById(userId)
│   │   ├── findByEmail(email)
│   │   ├── save(user)
│   │   └── existsByEmail(email)
│   │
│   ├── FileRepository
│   │   ├── readFromNAS(userId, path)
│   │   ├── writeToNAS(userId, path, content)
│   │   ├── listFiles(userId, directory)
│   │   └── createUserDirectory(userId)
│   │
│   └── CacheRepository
│       └── RedisClient
│
└── Configuration Layer
    ├── SecurityConfig
    │   ├── OAuth2 Client Configuration
    │   ├── JWT Configuration
    │   └── Session Configuration
    ├── NASConfig
    ├── RedisConfig
    ├── DatabaseConfig (MariaDB/PostgreSQL)
    └── AdSenseConfig
```

---

## 데이터 흐름도

### Google 로그인 흐름

```
[User: Click "Login with Google"]
  │
  ▼
[Frontend: Auth Component]
  │
  │ 1. Redirect to Google OAuth
  │    GET /api/auth/google/login
  │
  ▼
[Backend: AuthController]
  │
  │ 2. Generate OAuth state token
  │
  │ 3. Redirect to Google OAuth URL
  │    https://accounts.google.com/o/oauth2/v2/auth
  │
  ▼
[Google OAuth Server]
  │
  │ 4. User authenticates with Google
  │
  │ 5. Google redirects with authorization code
  │    GET /api/auth/google/callback?code=...
  │
  ▼
[Backend: AuthController]
  │
  │ 6. Exchange code for access token
  │    POST https://oauth2.googleapis.com/token
  │
  │ 7. Get user info from Google
  │    GET https://www.googleapis.com/oauth2/v2/userinfo
  │
  ▼
[AuthService]
  │
  │ 8. createOrUpdateUser(googleUserInfo)
  │    - Check if user exists (by email)
  │    - Create new user if not exists
  │    - Update user info if exists
  │
  │ 9. createUserFolder(userId)
  │    - Create /users/{userId}/ directory
  │
  │ 10. generateToken(userId)
  │     - Create JWT token
  │
  ▼
[Backend: AuthController]
  │
  │ 11. Set JWT token in cookie/response
  │
  │ 12. Redirect to main page
  │
  ▼
[Frontend: Session Manager]
  │
  │ 13. Store token in localStorage
  │
  │ 14. Load user profile
  │
  ▼
[User: Logged in, redirected to viewer]
```

### 파일 열기 흐름 (인증 포함)

```
[User: Request file] 
  │
  │ 1. URL 파라미터 또는 드래그앤드롭
  │
  ▼
[Frontend: File Handler]
  │
  │ 2. Check authentication token
  │
  │ 3. HTTP GET /api/files/{path}
  │    Headers: Authorization: Bearer {token}
  │
  ▼
[Backend: Security Filter]
  │
  │ 4. Validate JWT token
  │
  │ 5. Extract userId from token
  │
  ▼
[Backend: FileController]
  │
  │ 6. Validate path belongs to user
  │    (path must start with /users/{userId}/)
  │
  │ 7. CacheService.get(userId:path)
  │
  ▼
[CacheService]
  │
  ├─ Cache Hit ──► [Return Cached Content]
  │
  └─ Cache Miss ──► [FileService.readFile(userId, path)]
                      │
                      ▼
                   [FileRepository]
                      │
                      │ 8. Read from NAS
                      │    /users/{userId}/files/{path}
                      │
                      ▼
                   [NAS File System]
                      │
                      │ 9. Return File Content
                      │
                      ▼
                   [FileService]
                      │
                      │ 10. CacheService.put(userId:path, content)
                      │
                      ▼
                   [MarkdownService.renderMarkdown(content)]
                      │
                      │ 11. Convert Markdown → HTML
                      │
                      ▼
                   [Return HTML Response]
                      │
                      ▼
[Frontend: Viewer Component]
  │
  │ 12. Render HTML with Highlight.js
  │
  ▼
[User: View Markdown Content]
```

### 파일 편집 및 저장 흐름 (인증 포함)

```
[User: Double-click or Click Edit Icon]
  │
  ▼
[Frontend: Viewer Component]
  │
  │ 1. Check authentication token
  │
  │ 2. Switch to Editor Mode
  │
  ▼
[Frontend: Editor Component]
  │
  │ 3. User edits content
  │
  │ 4. User clicks Save or Ctrl+S
  │
  │ 5. HTTP POST /api/files/{path}
  │    Headers: Authorization: Bearer {token}
  │    Body: { content: "..." }
  │
  ▼
[Backend: Security Filter]
  │
  │ 6. Validate JWT token
  │
  │ 7. Extract userId from token
  │
  ▼
[Backend: FileController]
  │
  │ 8. Validate path belongs to user
  │    (path must start with /users/{userId}/)
  │
  │ 9. FileService.saveFile(userId, path, content)
  │
  ▼
[FileService]
  │
  │ 10. Validate content
  │
  │ 11. FileRepository.writeToNAS(userId, path, content)
  │
  ▼
[FileRepository]
  │
  │ 12. Write to NAS File System
  │     /users/{userId}/files/{path}
  │
  │ 13. Return Success
  │
  ▼
[FileService]
  │
  │ 14. CacheService.invalidate(userId:path)
  │
  ▼
[Backend: FileController]
  │
  │ 15. Return Success Response
  │
  ▼
[Frontend: Editor Component]
  │
  │ 16. Show Success Toast
  │
  │ 17. Reload file content
  │
  ▼
[User: View Updated Content]
```

### Smart Paste 흐름

```
[User: Paste Text into Editor]
  │
  ▼
[Frontend: Editor Component]
  │
  │ 1. Intercept paste event
  │
  │ 2. Extract pasted text
  │
  │ 3. HTTP POST /api/markdown/detect
  │    Body: { text: "..." }
  │
  ▼
[Backend: MarkdownController]
  │
  │ 4. MarkdownService.detectMarkdownFormat(text)
  │
  ▼
[MarkdownService]
  │
  │ 5. Analyze text patterns:
  │    - Headers (#, ##, ...)
  │    - Lists (-, *, 1.)
  │    - Code blocks (```)
  │    - Links ([text](url))
  │    - Bold/Italic (**text**, *text*)
  │
  │ 6. Return detection result
  │
  ▼
[Frontend: Editor Component]
  │
  │ 7. If markdown detected:
  │    - Insert formatted text
  │    - Trigger preview update
  │
  │ 8. If not markdown:
  │    - Insert as plain text
  │
  ▼
[User: See Formatted Content]
```

### 파일 변경 감지 및 자동 새로고침 흐름 (백그라운드 방지)

```
[Page Load]
  │
  │ 1. Initialize Visibility Manager
  │
  ▼
[Visibility Manager]
  │
  │ 2. Register visibilitychange event listener
  │
  │ 3. Check document.visibilityState
  │
  ├─ Tab Visible ──► [Start File Change Detection]
  │                     │
  │                     │ 4. Set interval (30초마다)
  │                     │    HTTP GET /api/files/{path}/check
  │                     │    Headers: If-Modified-Since
  │                     │
  │                     ▼
  │                  [Backend: FileController]
  │                     │
  │                     │ 5. Check file modification time
  │                     │
  │                     ├─ File Changed ──► [Return 200 with new content]
  │                     │                     │
  │                     │                     ▼
  │                     │                  [Frontend: Reload File]
  │                     │                     │
  │                     │                     ▼
  │                     │                  [User: See Updated Content]
  │                     │
  │                     └─ File Not Changed ──► [Return 304 Not Modified]
  │                                               │
  │                                               ▼
  │                                            [No Action]
  │
  └─ Tab Hidden ──► [Stop File Change Detection]
                       │
                       │ 6. Clear interval
                       │
                       │ 7. Pause auto-refresh
                       │
                       ▼
                    [No Background Updates]
                       │
                       │ (User switches back to tab)
                       │
                       ▼
                    [Tab Visible Event]
                       │
                       │ 8. Resume file change detection
                       │
                       │ 9. Check if file changed while hidden
                       │    (One-time check on visibility)
                       │
                       ▼
                    [Resume Normal Operation]
```

### 마지막 문서 자동 로드 흐름

```
[User: Login Success]
  │
  ▼
[Frontend: Last Document Manager]
  │
  │ 1. Check localStorage
  │    key: "lastDocumentPath"
  │
  ├─ Found in localStorage ──► [Load from localStorage]
  │                               │
  │                               │ 2. HTTP GET /api/files/{path}
  │                               │    Headers: Authorization: Bearer {token}
  │                               │
  │                               ▼
  │                            [Backend: FileController]
  │                               │
  │                               │ 3. Validate and return file
  │                               │
  │                               ▼
  │                            [Frontend: Load Document]
  │                               │
  │                               ▼
  │                            [User: See Last Document]
  │
  └─ Not Found ──► [Check Server]
                      │
                      │ 4. HTTP GET /api/users/me/last-document
                      │    Headers: Authorization: Bearer {token}
                      │
                      ▼
                   [Backend: UserController]
                      │
                      │ 5. Query database for last modified document
                      │    SELECT * FROM file_metadata
                      │    WHERE user_id = {userId}
                      │    ORDER BY last_modified DESC
                      │    LIMIT 1
                      │
                      ├─ Document Found ──► [Return document path]
                      │                        │
                      │                        ▼
                      │                     [Frontend: Load Document]
                      │                        │
                      │                        │ 6. Update localStorage
                      │                        │    localStorage.setItem("lastDocumentPath", path)
                      │                        │
                      │                        ▼
                      │                     [User: See Last Document]
                      │
                      └─ No Document ──► [Show Empty Screen]
                                           │
                                           ▼
                                        [User: See Empty Screen or File Selector]
```

### 자동 저장 흐름

```
[User: Editing Document]
  │
  │ 1. User types or pastes content
  │
  ▼
[Frontend: Editor Component]
  │
  │ 2. Content changed event
  │
  ▼
[Frontend: Auto Save Manager]
  │
  │ 3. Save to localStorage immediately
  │    localStorage.setItem("draft_{filePath}", {
  │      content: "...",
  │      timestamp: Date.now(),
  │      synced: false
  │    })
  │
  │ 4. Update change flag
  │    hasUnsavedChanges = true
  │
  │ 5. Show "저장 중..." indicator
  │
  │ 6. Start/Reset auto-save timer (3 minutes)
  │
  ├─ [Timer expires (3 minutes)] ──► [Auto Save to Server]
  │                                     │
  │                                     │ 7. Check if changes exist
  │                                     │    if (!hasUnsavedChanges) return
  │                                     │
  │                                     │ 8. HTTP POST /api/files/{path}
  │                                     │    Headers: Authorization: Bearer {token}
  │                                     │    Body: { content: "..." }
  │                                     │
  │                                     ▼
  │                                  [Backend: FileController]
  │                                     │
  │                                     │ 9. Validate and save file
  │                                     │
  │                                     │ 10. Update file_metadata.last_modified
  │                                     │
  │                                     │ 11. Return success
  │                                     │
  │                                     ▼
  │                                  [Frontend: Auto Save Manager]
  │                                     │
  │                                     │ 12. Update localStorage
  │                                     │     draft.synced = true
  │                                     │     draft.lastSynced = Date.now()
  │                                     │
  │                                     │ 13. Clear change flag
  │                                     │     hasUnsavedChanges = false
  │                                     │
  │                                     │ 14. Show "자동 저장됨" indicator
  │                                     │
  │                                     ▼
  │                                  [User: See Save Status]
  │
  └─ [User clicks Save (Ctrl+S)] ──► [Manual Save]
                                        │
                                        │ 15. HTTP POST /api/files/{path}
                                        │     (Same as auto-save)
                                        │
                                        │ 16. Show "저장됨" toast
                                        │
                                        ▼
                                     [User: See Save Confirmation]
```

### 로컬 파일 읽기/저장 흐름

```
[User: Click "로컬 파일 읽기"]
  │
  ▼
[Frontend: Local File Handler]
  │
  │ 1. Check File System Access API support
  │
  ├─ Supported ──► [Use File System Access API]
  │                  │
  │                  │ 2. window.showOpenFilePicker()
  │                  │
  │                  │ 3. User selects file
  │                  │
  │                  │ 4. Read file content
  │                  │    file.text() or file.stream()
  │                  │
  │                  │ 5. Display in viewer/editor
  │                  │
  │                  │ 6. Store file handle for later save
  │                  │
  │                  ▼
  │               [User: See File Content]
  │
  └─ Not Supported ──► [Use Traditional File Input]
                         │
                         │ 7. <input type="file"> click()
                         │
                         │ 8. User selects file
                         │
                         │ 9. FileReader API
                         │    reader.readAsText(file)
                         │
                         │ 10. Display in viewer/editor
                         │
                         ▼
                      [User: See File Content]
  │
  │ (User edits and wants to save locally)
  │
  ▼
[User: Click "로컬에 저장"]
  │
  ▼
[Frontend: Local File Handler]
  │
  │ 11. Check if file handle exists (File System Access API)
  │
  ├─ File Handle Exists ──► [Use File System Access API]
  │                          │
  │                          │ 12. fileHandle.createWritable()
  │                          │
  │                          │ 13. Write content
  │                          │     writable.write(content)
  │                          │
  │                          │ 14. Close file
  │                          │     writable.close()
  │                          │
  │                          ▼
  │                       [User: File Saved Locally]
  │
  └─ No File Handle ──► [Use Download API]
                         │
                         │ 15. Create Blob
                         │     blob = new Blob([content], { type: 'text/markdown' })
                         │
                         │ 16. Create download link
                         │     url = URL.createObjectURL(blob)
                         │
                         │ 17. Trigger download
                         │     <a download="file.md" href={url}>.click()
                         │
                         │ 18. Revoke URL
                         │     URL.revokeObjectURL(url)
                         │
                         ▼
                      [User: File Downloaded]
```

### 편집 종료 흐름

```
[User: Click "닫기" Button]
  │
  ▼
[Frontend: Editor Component]
  │
  │ 1. Check for unsaved changes
  │    - Check localStorage draft
  │    - Check hasUnsavedChanges flag
  │    - Compare with last synced version
  │
  ├─ No Changes ──► [Close Editor]
  │                   │
  │                   │ 2. Switch to viewer mode
  │                   │
  │                   │ 3. Clear editor state
  │                   │
  │                   ▼
  │                [User: Back to Viewer]
  │
  └─ Has Changes ──► [Show Confirmation Dialog]
                       │
                       │ 4. "저장하지 않은 변경사항이 있습니다."
                       │    Options:
                       │    - 저장 후 닫기
                       │    - 저장하지 않고 닫기
                       │    - 취소
                       │
                       ├─ [저장 후 닫기] ──► [Save and Close]
                       │                       │
                       │                       │ 5. HTTP POST /api/files/{path}
                       │                       │
                       │                       │ 6. Wait for save completion
                       │                       │
                       │                       │ 7. Clear localStorage draft
                       │                       │
                       │                       │ 8. Switch to viewer mode
                       │                       │
                       │                       ▼
                       │                    [User: Back to Viewer]
                       │
                       ├─ [저장하지 않고 닫기] ──► [Discard and Close]
                       │                            │
                       │                            │ 9. Clear localStorage draft
                       │                            │
                       │                            │ 10. Switch to viewer mode
                       │                            │
                       │                            ▼
                       │                         [User: Back to Viewer]
                       │
                       └─ [취소] ──► [Stay in Editor]
                                      │
                                      ▼
                                   [User: Continue Editing]
```

### 시나리오 흐름 검토 및 개선 사항

#### ✅ 잘 설계된 부분

1. **로그인 후 마지막 문서 자동 로드**
   - 사용자 경험 향상
   - localStorage와 서버 DB 이중 저장으로 안정성 확보

2. **폴더 및 파일 관리 창**
   - 직관적인 파일 탐색
   - 사이드바 또는 모달로 구현 가능

3. **자동 저장 메커니즘**
   - localStorage 즉시 저장으로 데이터 손실 방지
   - 주기적 서버 저장으로 동기화

4. **로컬 파일 읽기/저장**
   - File System Access API 활용
   - 오프라인 작업 지원

#### ⚠️ 개선이 필요한 부분

1. **자동 저장 타이밍**
   - **현재**: 3분마다 고정
   - **개선 제안**: 
     - 타이핑 중지 후 5초 (debounce)
     - 또는 변경사항 누적 시 (예: 100자 이상 변경)
     - 사용자 설정 가능하게

2. **마지막 문서 로드 실패 처리**
   - 문서가 삭제되었거나 접근 불가능한 경우
   - **해결**: 에러 처리 및 빈 화면 표시

3. **편집 종료 시 확인 다이얼로그**
   - 페이지를 떠날 때도 확인 필요 (beforeunload)
   - **추가**: 브라우저 닫기/새로고침 시에도 확인

4. **로컬 파일과 서버 파일 구분**
   - 로컬 파일은 서버에 업로드하지 않음
   - **명확화**: UI에서 로컬 파일임을 표시

#### 🔍 Redis 사용에 대한 명확한 답변

**❌ Redis는 자동 저장에 사용하지 않습니다.**

**이유:**
1. **자동 저장은 사용자별 로컬 상태**
   - 각 사용자의 편집 내용은 독립적
   - 브라우저별로 다른 상태
   - Redis는 공유 상태 관리용

2. **localStorage가 더 적합**
   - 즉시 저장 가능 (네트워크 지연 없음)
   - 오프라인 지원
   - 브라우저 네이티브 API

3. **Redis의 올바른 사용처**
   - ✅ 마크다운 렌더링 결과 캐싱
   - ✅ 파일 메타데이터 캐싱
   - ✅ 세션 관리 (선택적, JWT 사용 시 불필요)
   - ✅ 분산 환경에서 공유 캐시

**자동 저장 아키텍처:**
```
┌─────────────────────────────────────────┐
│         자동 저장 구조                   │
├─────────────────────────────────────────┤
│                                         │
│  [편집 중 변경사항]                      │
│           │                             │
│           ▼                             │
│  [localStorage 즉시 저장]                │
│  - 키: "draft_{filePath}"               │
│  - 값: { content, timestamp, synced }   │
│           │                             │
│           │ (3분마다 또는 변경 누적)     │
│           ▼                             │
│  [서버에 저장]                           │
│  POST /api/files/{path}                 │
│           │                             │
│           ▼                             │
│  [localStorage 업데이트]                 │
│  - synced: true                         │
│  - lastSynced: timestamp                 │
│                                         │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│         Redis 사용처                    │
├─────────────────────────────────────────┤
│                                         │
│  [마크다운 렌더링 결과 캐싱]             │
│  키: "render:{userId}:{filePath}:{hash}"│
│  값: HTML 렌더링 결과                   │
│  TTL: 1시간                             │
│                                         │
│  [파일 메타데이터 캐싱]                  │
│  키: "meta:{userId}:{filePath}"         │
│  값: { size, modified, ... }           │
│  TTL: 30분                              │
│                                         │
└─────────────────────────────────────────┘
```

#### 📋 추가 고려사항

1. **오프라인 지원**
   - Service Worker로 오프라인 모드 지원
   - 오프라인에서 편집한 내용은 온라인 시 자동 동기화

2. **충돌 해결**
   - 여러 탭에서 같은 파일 편집 시
   - 마지막 저장 우선 또는 사용자에게 선택권 제공

3. **저장 상태 표시**
   - "저장됨" / "저장 중..." / "저장 실패" / "저장 안 됨"
   - 시각적 인디케이터 (색상, 아이콘)

4. **성능 최적화**
   - 큰 파일의 경우 델타 저장 (변경된 부분만)
   - 압축 저장 (gzip)

---

## 기술 스택 구성

### 프론트엔드
```
┌─────────────────────────────────────┐
│      Frontend Technology Stack     │
├─────────────────────────────────────┤
│ HTML5                               │
│ CSS3 (Variables, Grid, Flexbox)    │
│ TypeScript 5.2+ (필수)             │
│                                     │
│ Build Tool:                         │
│ - Vite 5.0+                        │
│                                     │
│ Architecture:                       │
│ - Feature-Sliced Design (FSD)      │
│                                     │
│ Web APIs:                           │
│ - Page Visibility API               │
│   (백그라운드 업데이트 방지)         │
│ - Web Crypto API (암호화)           │
│ - File System Access API (선택적)   │
│                                     │
│ Libraries:                          │
│ - Highlight.js (Code Highlighting)  │
│ - Font Awesome (Icons)             │
│                                     │
│ External Services:                  │
│ - Google OAuth 2.0 (Login)         │
│ - Google AdSense                    │
└─────────────────────────────────────┘
```

### 백엔드
```
┌─────────────────────────────────────┐
│      Backend Technology Stack       │
├─────────────────────────────────────┤
│ Framework:                          │
│ - Spring Boot 3.x                   │
│ - Spring Web MVC                    │
│ - Spring Security                   │
│ - Spring OAuth2 Client              │
│ - Spring Cache                      │
│                                     │
│ Authentication & Authorization:     │
│ - JWT (JSON Web Token)              │
│ - Spring Security JWT               │
│ - Google OAuth2 Client              │
│                                     │
│ Markdown Processing:                │
│ - Flexmark-java                     │
│ - CommonMark                        │
│                                     │
│ Caching:                            │
│ - Spring Cache Abstraction          │
│ - Redis (for scaling)               │
│                                     │
│ Database:                           │
│ - MariaDB 10.11 (권장)              │
│ - PostgreSQL (대안)                   │
│ - Spring Data JPA                   │
│                                     │
│ Build Tool:                         │
│ - Maven or Gradle                   │
│                                     │
│ Server:                             │
│ - Embedded Tomcat                   │
│ - Nginx (Reverse Proxy)             │
└─────────────────────────────────────┘
```

### 인프라
```
┌─────────────────────────────────────┐
│      Infrastructure Stack           │
├─────────────────────────────────────┤
│ Storage:                            │
│ - NAS File System (NFS/SMB)        │
│                                     │
│ Cache:                              │
│ - Redis (Optional, for scaling)    │
│                                     │
│ Web Server:                         │
│ - Nginx (Reverse Proxy, SSL)       │
│                                     │
│ Container:                          │
│ - Docker                            │
│ - Docker Compose                    │
│                                     │
│ Monitoring:                         │
│ - Spring Boot Actuator              │
└─────────────────────────────────────┘
```

---

## 파일 보안 및 암호화

### 개요
개인적이고 중요한 파일이 서버에 저장될 때의 보안 및 프라이버시를 보장하기 위한 암호화 전략입니다. 사용자는 자신의 파일을 암호화하여 저장하거나, 서버에 저장하지 않고 로컬에서만 작업할 수 있습니다.

### 보안 요구사항

1. **개인 파일 보호**: 중요한 개인 파일은 서버 관리자도 읽을 수 없어야 함
2. **사용자 제어**: 사용자가 암호화 여부를 선택할 수 있어야 함
3. **로컬 전용 옵션**: 서버에 저장하지 않고 로컬에서만 작업 가능
4. **안전한 삭제**: 파일 삭제 시 서버에서 완전히 제거

### 암호화 전략

#### 1. 클라이언트 사이드 암호화 (권장)

**원칙:**
- 파일은 **브라우저에서 암호화**되어 서버로 전송
- 암호화 키는 **사용자만 알고 있음** (서버는 키를 모름)
- 서버는 암호화된 데이터만 저장 (평문을 볼 수 없음)

**구현 방법:**

```
┌─────────────────────────────────────────────────────┐
│           클라이언트 사이드 암호화 흐름             │
├─────────────────────────────────────────────────────┤
│                                                     │
│  [사용자가 파일 저장]                                │
│           │                                         │
│           ▼                                         │
│  [암호화 키 생성/입력]                               │
│  - 사용자 비밀번호 기반 (PBKDF2)                    │
│  - 또는 사용자가 직접 입력                          │
│           │                                         │
│           ▼                                         │
│  [AES-256-GCM 암호화]                               │
│  - 파일 내용 암호화                                  │
│  - IV (Initialization Vector) 생성                  │
│  - 인증 태그 생성 (무결성 검증)                     │
│           │                                         │
│           ▼                                         │
│  [암호화된 데이터 전송]                              │
│  POST /api/files/{path}                             │
│  Body: {                                             │
│    encrypted: true,                                 │
│    data: "<encrypted_base64>",                      │
│    iv: "<iv_base64>",                               │
│    tag: "<auth_tag_base64>"                         │
│  }                                                   │
│           │                                         │
│           ▼                                         │
│  [서버 저장]                                        │
│  - 암호화된 데이터만 저장                           │
│  - 키는 저장하지 않음                               │
│           │                                         │
│           ▼                                         │
│  [파일 읽기 시]                                     │
│  - 서버에서 암호화된 데이터 반환                    │
│  - 브라우저에서 복호화                              │
│  - 사용자에게 평문 표시                             │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**암호화 키 관리:**

1. **비밀번호 기반 키 파생 (PBKDF2)**
   ```javascript
   // 사용자 비밀번호로부터 암호화 키 생성
   const password = userInputPassword; // 사용자 입력
   const salt = generateSalt(); // 랜덤 솔트 생성
   const key = await crypto.subtle.deriveKey(
     {
       name: "PBKDF2",
       salt: salt,
       iterations: 100000,
       hash: "SHA-256"
     },
     passwordKey,
     { name: "AES-GCM", length: 256 },
     false,
     ["encrypt", "decrypt"]
   );
   ```

2. **키 저장 위치**
   - ❌ 서버에 저장하지 않음
   - ✅ 브라우저 localStorage (암호화된 형태)
   - ✅ 사용자 메모리에만 보관 (세션 종료 시 삭제)

#### 2. 파일 저장 모드 선택

**모드 1: 일반 저장 (암호화 없음)**
- 서버에 평문으로 저장
- 빠른 접근, 간단한 파일에 적합
- 서버 관리자가 읽을 수 있음

**모드 2: 암호화 저장**
- 클라이언트 사이드 암호화 후 저장
- 중요한 개인 파일에 적합
- 서버 관리자도 읽을 수 없음

**모드 3: 로컬 전용 (서버 저장 안 함)**
- 서버에 저장하지 않음
- 로컬 파일 시스템에만 저장
- 완전한 프라이버시 보장

#### 3. 암호화 구현 상세

**프론트엔드 암호화 컴포넌트:**

```javascript
class FileEncryption {
  constructor() {
    this.algorithm = { name: "AES-GCM", length: 256 };
  }
  
  async encryptFile(content, password) {
    // 1. 키 파생
    const key = await this.deriveKey(password);
    
    // 2. IV 생성
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    // 3. 암호화
    const encodedContent = new TextEncoder().encode(content);
    const encryptedData = await crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: iv
      },
      key,
      encodedContent
    );
    
    // 4. Base64 인코딩
    return {
      encrypted: btoa(String.fromCharCode(...new Uint8Array(encryptedData))),
      iv: btoa(String.fromCharCode(...iv)),
      tag: btoa(String.fromCharCode(...new Uint8Array(encryptedData.slice(-16))))
    };
  }
  
  async decryptFile(encryptedData, password) {
    // 1. 키 파생
    const key = await this.deriveKey(password);
    
    // 2. Base64 디코딩
    const encrypted = Uint8Array.from(atob(encryptedData.encrypted), c => c.charCodeAt(0));
    const iv = Uint8Array.from(atob(encryptedData.iv), c => c.charCodeAt(0));
    
    // 3. 복호화
    const decrypted = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: iv
      },
      key,
      encrypted
    );
    
    // 4. 텍스트로 변환
    return new TextDecoder().decode(decrypted);
  }
  
  async deriveKey(password) {
    const encoder = new TextEncoder();
    const passwordKey = await crypto.subtle.importKey(
      "raw",
      encoder.encode(password),
      "PBKDF2",
      false,
      ["deriveKey"]
    );
    
    const salt = this.getSalt(); // 사용자별 고유 솔트
    
    return await crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: salt,
        iterations: 100000,
        hash: "SHA-256"
      },
      passwordKey,
      this.algorithm,
      false,
      ["encrypt", "decrypt"]
    );
  }
}
```

**백엔드 저장 구조:**

```java
@Entity
public class FileMetadata {
    @Id
    private Long id;
    
    private String userId;
    private String filePath;
    private boolean encrypted;  // 암호화 여부
    private String iv;          // IV (Base64)
    private String authTag;     // 인증 태그 (Base64)
    private byte[] encryptedContent; // 암호화된 파일 내용
    private Long fileSize;
    private LocalDateTime lastModified;
    
    // 암호화된 파일은 평문을 저장하지 않음
    // encryptedContent만 저장
}
```

#### 4. 파일 삭제 전략

**일반 삭제:**
- 파일 시스템에서 삭제
- 메타데이터에서 제거
- ⚠️ 디스크에 데이터가 남을 수 있음

**안전 삭제 (Secure Delete):**
- 파일을 삭제하기 전에 랜덤 데이터로 덮어쓰기
- 여러 번 덮어쓰기 (DoD 5220.22-M 표준)
- 암호화된 파일의 경우 키도 함께 삭제

**구현:**

```java
public void secureDelete(String filePath) {
    File file = new File(filePath);
    
    if (file.exists()) {
        // 1. 파일 크기 확인
        long length = file.length();
        
        // 2. 랜덤 데이터로 덮어쓰기 (3회)
        RandomAccessFile raf = new RandomAccessFile(file, "rws");
        byte[] randomData = new byte[(int) length];
        
        for (int i = 0; i < 3; i++) {
            new SecureRandom().nextBytes(randomData);
            raf.seek(0);
            raf.write(randomData);
            raf.getFD().sync();
        }
        
        raf.close();
        
        // 3. 파일 삭제
        file.delete();
    }
}
```

#### 5. UI/UX - 암호화 옵션

**파일 저장 시:**

```
┌─────────────────────────────────────┐
│      파일 저장 옵션                  │
├─────────────────────────────────────┤
│                                     │
│  저장 모드 선택:                    │
│  ○ 일반 저장 (암호화 없음)          │
│  ● 암호화 저장                      │
│  ○ 로컬 전용 (서버 저장 안 함)      │
│                                     │
│  [암호화 저장 선택 시]               │
│  비밀번호: [___________]            │
│  비밀번호 확인: [___________]       │
│  ☑ 비밀번호 저장 (로컬에만)         │
│                                     │
│  [저장] [취소]                      │
│                                     │
└─────────────────────────────────────┘
```

**파일 읽기 시:**

```
[암호화된 파일 열기]
  │
  ▼
[비밀번호 입력 요청]
  │
  ├─ [비밀번호 입력] ──► [복호화 및 표시]
  │
  └─ [취소] ──► [파일 열기 취소]
```

### 데이터 흐름도 - 암호화 저장

```
[User: Save File with Encryption]
  │
  │ 1. 사용자가 "암호화 저장" 선택
  │
  ▼
[Frontend: Encryption Component]
  │
  │ 2. 비밀번호 입력 요청
  │
  │ 3. 사용자 비밀번호 입력
  │
  │ 4. PBKDF2로 암호화 키 파생
  │    - Salt: 사용자별 고유 솔트
  │    - Iterations: 100,000
  │
  │ 5. AES-256-GCM 암호화
  │    - IV 생성 (12 bytes)
  │    - 파일 내용 암호화
  │    - 인증 태그 생성
  │
  │ 6. Base64 인코딩
  │
  │ 7. HTTP POST /api/files/{path}
  │    Body: {
  │      encrypted: true,
  │      data: "<encrypted_base64>",
  │      iv: "<iv_base64>",
  │      tag: "<auth_tag_base64>"
  │    }
  │
  ▼
[Backend: FileController]
  │
  │ 8. 암호화된 데이터 검증
  │
  │ 9. FileService.saveEncryptedFile()
  │
  ▼
[FileService]
  │
  │ 10. 암호화된 데이터 저장
  │     - 평문 저장하지 않음
  │     - IV, Tag와 함께 저장
  │
  │ 11. FileMetadata 업데이트
  │     encrypted = true
  │
  ▼
[FileRepository]
  │
  │ 12. NAS에 암호화된 파일 저장
  │     /users/{userId}/files/{path}.encrypted
  │
  ▼
[Success Response]
  │
  ▼
[Frontend: Show Success]
  │
  │ 13. 비밀번호는 localStorage에 저장하지 않음
  │     (또는 사용자 선택 시 암호화하여 저장)
  │
  ▼
[User: File Saved Encrypted]
```

### 데이터 흐름도 - 암호화 파일 읽기

```
[User: Open Encrypted File]
  │
  │ 1. HTTP GET /api/files/{path}
  │
  ▼
[Backend: FileController]
  │
  │ 2. FileMetadata 확인
  │    encrypted = true
  │
  │ 3. 암호화된 파일 내용 반환
  │    {
  │      encrypted: true,
  │      data: "<encrypted_base64>",
  │      iv: "<iv_base64>",
  │      tag: "<auth_tag_base64>"
  │    }
  │
  ▼
[Frontend: Encryption Component]
  │
  │ 4. 암호화된 파일 감지
  │
  │ 5. 비밀번호 입력 요청
  │    (localStorage에 저장된 비밀번호 확인)
  │
  ├─ [비밀번호 있음] ──► [자동 복호화 시도]
  │
  └─ [비밀번호 없음] ──► [사용자 입력 요청]
                          │
                          │ 6. 사용자 비밀번호 입력
                          │
                          │ 7. PBKDF2로 키 파생
                          │
                          │ 8. AES-256-GCM 복호화
                          │
                          │ 9. 인증 태그 검증
                          │
                          ├─ [검증 성공] ──► [평문 표시]
                          │
                          └─ [검증 실패] ──► [에러: 잘못된 비밀번호]
```

### 보안 모범 사례

#### 1. 키 관리
- ✅ 암호화 키는 서버에 저장하지 않음
- ✅ 사용자 비밀번호는 PBKDF2로 키 파생 (100,000+ iterations)
- ✅ 각 파일마다 고유한 IV 사용
- ✅ 인증 태그로 무결성 검증

#### 2. 전송 보안
- ✅ HTTPS 필수 (TLS 1.2+)
- ✅ 암호화된 데이터도 HTTPS로 전송
- ✅ JWT 토큰으로 인증

#### 3. 저장 보안
- ✅ 암호화된 파일은 평문과 구분하여 저장
- ✅ 파일 시스템 권한 설정 (chmod 600)
- ✅ 백업도 암호화된 상태로 저장

#### 4. 사용자 경험
- ✅ 암호화 여부를 UI에 명확히 표시
- ✅ 비밀번호 입력 시 보안 안내
- ✅ 비밀번호 분실 시 복구 불가 안내

### 로컬 전용 모드

**특징:**
- 서버에 파일을 저장하지 않음
- 로컬 파일 시스템에만 저장
- File System Access API 또는 다운로드 사용

**사용 사례:**
- 매우 중요한 개인 파일
- 서버 저장을 원하지 않는 파일
- 오프라인 작업

**구현:**
- 파일 저장 시 "로컬 전용" 옵션 선택
- 서버 API 호출 없이 로컬에만 저장
- File System Access API 또는 Blob 다운로드

### 암호화 성능 고려사항

1. **암호화 오버헤드**
   - AES-256-GCM: 빠른 암호화/복호화
   - PBKDF2: 키 파생에 시간 소요 (의도적)
   - 큰 파일의 경우 스트리밍 암호화 고려

2. **캐싱 전략**
   - 복호화된 내용은 메모리에만 보관
   - localStorage에는 저장하지 않음
   - 세션 종료 시 메모리에서 삭제

3. **병렬 처리**
   - 여러 파일 암호화 시 Web Workers 활용
   - UI 블로킹 방지

### 기술 스택 추가

**프론트엔드:**
- Web Crypto API (브라우저 네이티브)
- SubtleCrypto API
- PBKDF2, AES-GCM 지원

**백엔드:**
- 암호화된 데이터 저장만 담당
- 복호화 로직 없음 (클라이언트에서만)
- 파일 메타데이터 관리

---

## 배포 구조

### Phase 1: NAS 배포 (초기)

```
                    Internet
                       │
                       ▼
              ┌────────────────┐
              │   Router/Gateway│
              └────────┬───────┘
                       │
                       ▼
              ┌────────────────┐
              │   Port Forward  │
              │   (80, 443)     │
              └────────┬───────┘
                       │
                       ▼
        ┌──────────────────────────────┐
        │         Home NAS             │
        │  ┌────────────────────────┐  │
        │  │   Docker Container     │  │
        │  │  ┌──────────────────┐  │  │
        │  │  │   Nginx          │  │  │
        │  │  │  (Reverse Proxy) │  │  │
        │  │  └────────┬─────────┘  │  │
        │  │           │            │  │
        │  │  ┌────────▼─────────┐  │  │
        │  │  │  Spring Boot App │  │  │
        │  │  │  (Tomcat)        │  │  │
        │  │  └────────┬─────────┘  │  │
        │  └───────────┼────────────┘  │
        │              │                │
        │  ┌───────────▼────────────┐  │
        │  │   NAS File System      │  │
        │  │   (/markdown-files)    │  │
        │  └────────────────────────┘  │
        └──────────────────────────────┘
```

### Phase 2: 클라우드 전환 (확장 시)

```
                    Internet
                       │
                       ▼
              ┌────────────────┐
              │   Cloud Load    │
              │   Balancer      │
              └────────┬───────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
        ▼              ▼              ▼
   ┌─────────┐   ┌─────────┐   ┌─────────┐
   │  Nginx  │   │  Nginx  │   │  Nginx  │
   │ Instance│   │ Instance│   │ Instance│
   └────┬────┘   └────┬────┘   └────┬────┘
        │             │             │
        ▼             ▼             ▼
   ┌─────────┐   ┌─────────┐   ┌─────────┐
   │ Spring  │   │ Spring  │   │ Spring  │
   │ Boot    │   │ Boot    │   │ Boot    │
   │ App 1   │   │ App 2   │   │ App 3   │
   └────┬────┘   └────┬────┘   └────┬────┘
        │             │             │
        └─────────────┼─────────────┘
                      │
        ┌─────────────▼─────────────┐
        │      Redis Cluster        │
        │    (Shared Cache)         │
        └─────────────┬─────────────┘
                      │
        ┌─────────────▼─────────────┐
        │   Cloud Storage (NFS)     │
        │   or Object Storage        │
        └───────────────────────────┘
```

---

## 확장성 전략

### 사용자 규모별 아키텍처

#### 1. 초기 단계 (100-500명/일)
```
- 단일 Spring Boot 인스턴스
- 내장 Tomcat
- 로컬 파일 시스템 (NAS)
- 인메모리 캐시 (Caffeine)
- Nginx (단일 인스턴스)
```

#### 2. 성장 단계 (1000명/일)
```
- Spring Boot 인스턴스 2-3개
- Nginx 로드 밸런싱
- Redis 캐시 (단일 인스턴스)
- NAS 파일 시스템 (NFS)
- 모니터링 (Spring Boot Actuator)
```

#### 3. 확장 단계 (5000명/일) - Kubernetes 기반
```
- Kubernetes 클러스터
  - Spring Boot Pods (5-10개, HPA 적용)
  - Nginx Ingress Controller
  - Redis Cluster (StatefulSet)
- 메시지 큐: RabbitMQ 또는 Kafka
  - 파일 업로드 비동기 처리
  - 마크다운 렌더링 작업 큐
  - 이벤트 스트리밍
- 캐싱 전략 (다층 캐싱)
  - L1: 애플리케이션 인메모리 캐시 (Caffeine)
  - L2: Redis 클러스터 (분산 캐시)
  - L3: CDN (정적 파일, 렌더링된 HTML)
- 클라우드 스토리지 (NFS/Object Storage)
- 모니터링 및 관찰성
  - Prometheus + Grafana (메트릭)
  - ELK Stack (로깅)
  - Jaeger 또는 Zipkin (분산 트레이싱)
```

### 성능 최적화 전략

#### 1. 다층 캐싱 전략 (Multi-Layer Caching)

**L1 캐시 (애플리케이션 레벨)**
- Caffeine 인메모리 캐시
- 자주 접근하는 파일 메타데이터
- 사용자 세션 정보
- TTL: 5분, 최대 크기: 1000개

**L2 캐시 (분산 캐시)**
- Redis 클러스터
- 마크다운 렌더링 결과 (TTL: 1시간)
- 파일 메타데이터 (TTL: 30분)
- 사용자별 마지막 문서 정보 (TTL: 24시간)
- 캐시 무효화 전략: Write-Through, Write-Behind

**L3 캐시 (CDN)**
- 정적 파일 (CSS, JS, 이미지)
- 렌더링된 HTML (선택적)
- 캐시 헤더 최적화 (Cache-Control, ETag)

**캐싱 전략 선택 가이드**
- **Cache-Aside**: 파일 읽기 (가장 일반적)
- **Write-Through**: 파일 저장 시 캐시와 DB 동시 업데이트
- **Write-Behind**: 비동기로 캐시 업데이트 (MQ 활용)

#### 2. 비동기 처리 전략 (MQ/Kafka)

**RabbitMQ 사용 사례**
- 파일 업로드 처리 큐
- 마크다운 렌더링 작업 큐
- 이메일 알림 (향후 확장)
- 배치 작업 (백업, 정리)

**Kafka 사용 사례**
- 파일 변경 이벤트 스트리밍
- 사용자 활동 로그 수집
- 실시간 분석 (파일 접근 패턴)
- 이벤트 소싱 (선택적)

**비동기 처리 흐름**
```
[사용자 요청]
  │
  ▼
[API Gateway]
  │
  ├─ [동기 처리] ──► [즉시 응답]
  │   - 파일 읽기 (캐시 히트)
  │   - 간단한 메타데이터 조회
  │
  └─ [비동기 처리] ──► [MQ/Kafka] ──► [워커 프로세스]
      - 파일 업로드
      - 마크다운 렌더링
      - 파일 인덱싱
```

#### 3. 대용량 트래픽 대응

**로드 밸런싱**
- Kubernetes Service (ClusterIP, LoadBalancer)
- Nginx Ingress Controller
- 세션 어피니티 (Sticky Session) 또는 Stateless 설계

**오토스케일링**
- Horizontal Pod Autoscaler (HPA)
- 메트릭 기반: CPU, Memory, Request Rate
- 커스텀 메트릭: 큐 길이, 응답 시간

**데이터베이스 최적화**
- 읽기 전용 복제본 (Read Replica)
- 커넥션 풀링
- 쿼리 최적화 및 인덱싱
- 필요시 샤딩 (사용자 ID 기반)

**파일 스토리지 최적화**
- Object Storage (S3 호환) 활용
- CDN 연동
- 파일 압축 (gzip)
- 점진적 로딩 (Chunked Transfer)

#### 4. 모니터링 및 관찰성

**메트릭 (Prometheus)**
- 애플리케이션 메트릭: 요청 수, 응답 시간, 에러율
- 인프라 메트릭: CPU, Memory, Disk, Network
- 비즈니스 메트릭: 활성 사용자, 파일 저장 수, 캐시 히트율

**로깅 (ELK Stack)**
- 구조화된 로깅 (JSON)
- 로그 레벨 관리
- 중앙 집중식 로그 수집

**트레이싱 (Jaeger/Zipkin)**
- 분산 트레이싱
- 요청 흐름 추적
- 병목 지점 식별

---

## 보안 고려사항

### 파일 시스템 보안
- 파일 경로 검증 (Path Traversal 방지)
- 파일 확장자 검증 (.md, .markdown만 허용)
- 파일 크기 제한 (16MB)
- 파일명 위험 문자 제거

### 웹 보안
- HTTPS 강제 (SSL/TLS)
- CORS 설정
- XSS 방지 (입력값 검증 및 이스케이프)
- CSRF 토큰 (필요시)

### 인프라 보안
- 방화벽 규칙 설정
- 포트 제한 (80, 443만 개방)
- 정기적인 보안 업데이트

---

## 모니터링 및 로깅

### 모니터링 아키텍처

```
┌─────────────────────────────────────────────────────┐
│              Monitoring Stack                       │
├─────────────────────────────────────────────────────┤
│                                                     │
│  [Spring Boot Application]                         │
│  │                                                  │
│  ├─ Spring Boot Actuator                           │
│  │  - Health Checks                                │
│  │  - Metrics Endpoint                             │
│  │  - Info Endpoint                                │
│  │                                                  │
│  ├─ Micrometer                                     │
│  │  - Prometheus Registry                          │
│  │  - Custom Metrics                               │
│  │  - Distributed Tracing                          │
│  │                                                  │
│  └─ Logback                                        │
│     - Structured Logging (JSON)                   │
│     - Log Rotation                                 │
│                                                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│  [Metrics Collection]                              │
│  │                                                  │
│  ├─ Prometheus                                     │
│  │  - 메트릭 수집 및 저장                          │
│  │  - Alert Rules                                  │
│  │                                                  │
│  └─ Grafana                                        │
│     - 대시보드 시각화                              │
│     - 알림 설정                                    │
│                                                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│  [Logging Collection]                              │
│  │                                                  │
│  └─ ELK Stack                                      │
│     - Elasticsearch (저장)                         │
│     - Logstash (처리)                              │
│     - Kibana (시각화)                              │
│                                                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│  [Distributed Tracing]                             │
│  │                                                  │
│  └─ Zipkin / Jaeger                                │
│     - 요청 추적                                    │
│     - 성능 분석                                    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### 모니터링 지표

#### 애플리케이션 메트릭
- **HTTP 메트릭**: 요청 수, 응답 시간 (p50, p95, p99), 에러율
- **비즈니스 메트릭**: 파일 작업 수 (read/write/delete), 마크다운 렌더링 시간
- **캐시 메트릭**: 히트율, 미스율, 캐시 크기
- **MQ 메트릭**: 큐 길이, 메시지 처리 속도, Consumer 수

#### 인프라 메트릭
- **JVM 메트릭**: 메모리 사용량, GC 일시정지 시간, 스레드 수
- **시스템 메트릭**: CPU 사용률, 디스크 사용률, 네트워크 트래픽
- **데이터베이스 메트릭**: 연결 수, 쿼리 실행 시간, 트랜잭션 수

### 로깅 전략

#### 로그 레벨
- **ERROR**: 에러 및 예외 상황
- **WARN**: 경고 상황 (성능 저하, 리소스 부족)
- **INFO**: 주요 비즈니스 이벤트 (파일 저장, 사용자 로그인)
- **DEBUG**: 상세 디버깅 정보 (개발 환경)

#### 구조화된 로깅
- JSON 형식으로 로그 출력
- MDC (Mapped Diagnostic Context) 활용
- 로그 컨텍스트: userId, requestId, filePath 등

#### 로그 수집
- Spring Boot Logging (Logback)
- 구조화된 로그 (JSON) → ELK Stack
- 액세스 로그 (Nginx) → 별도 수집
- 에러 로그 집중 관리 및 알림

---

## 백그라운드 업데이트 방지 기능

### 개요
사용자가 브라우저 탭을 다른 탭으로 전환하거나 브라우저를 최소화했을 때, 페이지가 백그라운드에 있는 동안 자동 새로고침이나 파일 변경 감지를 중지하여 불필요한 네트워크 요청과 리소스 사용을 방지합니다.

### 구현 방법

#### 1. Page Visibility API 활용
```javascript
// 브라우저 네이티브 API 사용
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    // 탭이 숨겨짐 - 자동 업데이트 중지
    stopFileChangeDetection();
  } else {
    // 탭이 다시 보임 - 자동 업데이트 재개
    resumeFileChangeDetection();
  }
});
```

#### 2. 동작 원리

**탭이 활성화되어 있을 때 (Visible)**
- 30초마다 파일 변경 감지 API 호출
- 파일이 변경되었으면 자동으로 콘텐츠 새로고침
- 사용자가 보고 있는 콘텐츠가 최신 상태 유지

**탭이 비활성화되어 있을 때 (Hidden)**
- 파일 변경 감지 인터벌 중지
- 자동 새로고침 중지
- 네트워크 요청 없음 (배터리 및 리소스 절약)

**탭이 다시 활성화될 때**
- 한 번만 파일 변경 여부 확인 (조용한 체크)
- 변경되었으면 사용자에게 알림 또는 자동 새로고침
- 정상적인 파일 변경 감지 재개

#### 3. API 엔드포인트

**파일 변경 감지 API**
```
GET /api/files/{path}/check
Headers:
  If-Modified-Since: <last-modified-timestamp>

Response:
  200 OK: 파일이 변경됨
    Body: { modified: true, lastModified: <timestamp>, content: <html> }
  
  304 Not Modified: 파일이 변경되지 않음
    Body: (empty)
```

#### 4. 프론트엔드 구현 예시

```javascript
class VisibilityManager {
  constructor() {
    this.checkInterval = null;
    this.isVisible = !document.hidden;
    this.lastModified = null;
    this.currentFilePath = null;
    
    this.init();
  }
  
  init() {
    document.addEventListener('visibilitychange', () => {
      this.handleVisibilityChange();
    });
  }
  
  handleVisibilityChange() {
    if (document.hidden) {
      // 탭이 숨겨짐
      this.stopChecking();
    } else {
      // 탭이 다시 보임
      this.resumeChecking();
    }
  }
  
  startChecking(filePath) {
    this.currentFilePath = filePath;
    if (!this.isVisible) return;
    
    this.checkInterval = setInterval(() => {
      this.checkFileChange(filePath);
    }, 30000); // 30초마다 체크
  }
  
  stopChecking() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }
  
  resumeChecking() {
    if (!this.currentFilePath) return;
    
    // 한 번만 체크 (조용한 체크)
    this.checkFileChange(this.currentFilePath, true);
    
    // 정상적인 인터벌 재개
    this.startChecking(this.currentFilePath);
  }
  
  async checkFileChange(filePath, silent = false) {
    const headers = {};
    if (this.lastModified) {
      headers['If-Modified-Since'] = this.lastModified;
    }
    
    try {
      const response = await fetch(`/api/files/${filePath}/check`, {
        method: 'GET',
        headers: headers
      });
      
      if (response.status === 200) {
        // 파일이 변경됨
        const data = await response.json();
        this.lastModified = data.lastModified;
        
        if (!silent) {
          // 사용자에게 알림 또는 자동 새로고침
          this.reloadContent(data.content);
        }
      } else if (response.status === 304) {
        // 파일이 변경되지 않음
        // 아무 작업도 하지 않음
      }
    } catch (error) {
      console.error('File change check failed:', error);
    }
  }
  
  reloadContent(content) {
    // 콘텐츠 새로고침 로직
    // 또는 사용자에게 알림 표시
  }
}
```

#### 5. 백엔드 구현 예시 (Spring Boot)

```java
@RestController
@RequestMapping("/api/files")
public class FileController {
    
    @GetMapping("/{path}/check")
    public ResponseEntity<?> checkFileModified(
            @PathVariable String path,
            @RequestHeader(value = "If-Modified-Since", required = false) 
            String ifModifiedSince) {
        
        File file = fileService.getFile(path);
        long lastModified = file.lastModified();
        
        if (ifModifiedSince != null) {
            try {
                long clientLastModified = Instant.parse(ifModifiedSince)
                    .toEpochMilli();
                
                if (lastModified <= clientLastModified) {
                    // 파일이 변경되지 않음
                    return ResponseEntity.status(HttpStatus.NOT_MODIFIED).build();
                }
            } catch (Exception e) {
                // 파싱 실패 시 전체 콘텐츠 반환
            }
        }
        
        // 파일이 변경됨
        String content = fileService.readFile(path);
        String html = markdownService.renderMarkdown(content);
        
        return ResponseEntity.ok()
            .header("Last-Modified", Instant.ofEpochMilli(lastModified)
                .toString())
            .body(Map.of(
                "modified", true,
                "lastModified", lastModified,
                "content", html
            ));
    }
}
```

### 장점

1. **리소스 절약**: 백그라운드에서 불필요한 네트워크 요청 방지
2. **배터리 절약**: 모바일 기기에서 배터리 수명 연장
3. **서버 부하 감소**: 불필요한 API 호출 감소로 서버 리소스 절약
4. **사용자 경험**: 사용자가 보고 있지 않을 때는 업데이트하지 않아 혼란 방지
5. **확장성**: 대량의 사용자가 있을 때 서버 부하를 크게 줄임

### 브라우저 호환성

- **Chrome/Edge**: 완전 지원 (모든 버전)
- **Firefox**: 완전 지원 (모든 버전)
- **Safari**: 완전 지원 (Safari 7+)
- **모바일 브라우저**: iOS Safari, Chrome Mobile 모두 지원

---

## 사용자별 폴더 관리 구조

### 개요
Google 로그인을 통해 인증된 각 사용자는 독립적인 폴더 구조를 가지며, 자신의 파일만 접근할 수 있습니다. 이를 통해 데이터 격리와 보안을 보장합니다.

### 폴더 구조

```
/markdown-viewer-data/
│
├── users/
│   │
│   ├── {userId1}/                    # 사용자 1의 폴더
│   │   ├── files/                    # 마크다운 파일 저장 위치
│   │   │   ├── document1.md
│   │   │   ├── document2.md
│   │   │   └── subfolder/
│   │   │       └── document3.md
│   │   │
│   │   └── .metadata/                # 사용자 메타데이터 (선택적)
│   │       └── preferences.json
│   │
│   ├── {userId2}/                    # 사용자 2의 폴더
│   │   └── files/
│   │       └── ...
│   │
│   └── {userId3}/                    # 사용자 3의 폴더
│       └── files/
│           └── ...
│
└── shared/                           # 공유 파일 (향후 확장)
    └── ...
```

### 사용자 ID 생성 규칙

**Google OAuth에서 제공하는 정보:**
- `sub`: Google 고유 사용자 ID (예: `123456789012345678901`)
- `email`: Google 이메일 주소 (예: `user@example.com`)
- `name`: 사용자 이름
- `picture`: 프로필 사진 URL

**사용자 ID 결정 전략:**
1. **Google `sub` 사용**: 가장 안전하고 고유한 식별자
   - 장점: 변경 불가능, 고유성 보장
   - 단점: 긴 숫자 문자열

2. **이메일 기반 해시**: 이메일을 해시하여 사용
   - 장점: 읽기 쉬운 폴더명
   - 단점: 이메일 변경 시 문제 발생 가능

3. **하이브리드 접근**: 데이터베이스에 매핑 테이블 사용
   - `users` 테이블에 `google_sub`, `email`, `user_id` 저장
   - `user_id`는 짧은 UUID 또는 순차적 ID 사용
   - 폴더명은 `user_id` 사용

**권장 방식: 하이브리드 접근**
```sql
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    google_sub VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    picture_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 보안 고려사항

#### 1. 경로 검증
모든 파일 접근 요청에서 사용자 ID와 경로를 검증:

```java
public void validateUserPath(String userId, String requestedPath) {
    // 경로가 사용자 폴더로 시작하는지 확인
    String userFolder = "/users/" + userId + "/";
    if (!requestedPath.startsWith(userFolder)) {
        throw new SecurityException("Access denied: Invalid path");
    }
    
    // Path Traversal 공격 방지
    Path normalizedPath = Paths.get(requestedPath).normalize();
    if (!normalizedPath.toString().startsWith(userFolder)) {
        throw new SecurityException("Access denied: Path traversal detected");
    }
}
```

#### 2. 파일 권한
- 각 사용자는 자신의 폴더(`/users/{userId}/`)만 접근 가능
- 다른 사용자의 폴더 접근 시도는 즉시 차단
- 파일 시스템 레벨에서도 권한 설정 (chmod 700)

#### 3. JWT 토큰 검증
모든 API 요청에서 JWT 토큰을 검증하고 사용자 ID를 추출:

```java
@PreAuthorize("hasRole('USER')")
@GetMapping("/api/files/{path}")
public ResponseEntity<?> getFile(@PathVariable String path) {
    String userId = getCurrentUserId(); // JWT에서 추출
    validateUserPath(userId, path);
    // ... 파일 읽기 로직
}
```

### 데이터베이스 스키마

#### Users 테이블
```sql
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    google_sub VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    picture_url TEXT,
    storage_quota BIGINT DEFAULT 1073741824, -- 1GB 기본 할당량
    storage_used BIGINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP
);

CREATE INDEX idx_users_google_sub ON users(google_sub);
CREATE INDEX idx_users_email ON users(email);
```

#### 파일 메타데이터 테이블 (선택적)
```sql
CREATE TABLE file_metadata (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    file_path VARCHAR(1024) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size BIGINT,
    mime_type VARCHAR(100),
    last_modified TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, file_path)
);

CREATE INDEX idx_file_metadata_user_path ON file_metadata(user_id, file_path);
```

### 사용자 폴더 생성 프로세스

```
[User logs in with Google]
  │
  ▼
[AuthService.createOrUpdateUser(googleUserInfo)]
  │
  │ 1. Check if user exists (by google_sub)
  │
  ├─ User Exists ──► [Update last_login_at]
  │                     │
  │                     └─► [Return existing user]
  │
  └─ New User ──► [Create user record in database]
                    │
                    │ 2. Generate user folder path
                    │    /users/{userId}/
                    │
                    │ 3. Create directory structure
                    │    - /users/{userId}/files/
                    │    - /users/{userId}/.metadata/
                    │
                    │ 4. Set file permissions (700)
                    │
                    │ 5. Create default preferences.json
                    │
                    ▼
                 [Return new user]
```

### API 경로 예시

**사용자 파일 목록**
```
GET /api/files
Authorization: Bearer {jwt_token}

Response:
{
  "files": [
    {
      "name": "document1.md",
      "path": "/users/{userId}/files/document1.md",
      "size": 1024,
      "lastModified": "2026-01-29T10:30:00Z"
    }
  ]
}
```

**파일 읽기**
```
GET /api/files/document1.md
Authorization: Bearer {jwt_token}

실제 경로: /users/{userId}/files/document1.md
```

**파일 저장**
```
POST /api/files/document1.md
Authorization: Bearer {jwt_token}
Body: { "content": "..." }

실제 경로: /users/{userId}/files/document1.md
```

### 확장성 고려사항

#### 1. 사용자 수 증가 시
- **초기 (100-1000명)**: 단일 NAS 파일 시스템으로 충분
- **성장 (1000-5000명)**: 사용자별 폴더 구조 유지, 필요시 샤딩 고려
- **대규모 (5000명+)**: 클라우드 스토리지로 마이그레이션, 사용자별 버킷 또는 프리픽스 사용

#### 2. 저장 공간 관리
- 사용자별 할당량 설정 (기본 1GB)
- 사용량 모니터링 및 알림
- 필요시 확장 가능한 할당량 제공

#### 3. 백업 전략
- 사용자별 폴더 단위 백업
- 증분 백업으로 효율성 향상
- 클라우드 전환 시 자동 백업 통합

---

## 다음 단계

이 시스템 구성도를 바탕으로 다음 문서들을 순차적으로 작성할 예정입니다:

1. **요구사항 명세서** - 상세 기능 요구사항 정의
2. **API 명세서** - REST API 엔드포인트 상세 정의
3. **데이터베이스 설계** - 메타데이터 저장 구조 (필요시)
4. **UI/UX 설계** - 단일 화면 뷰어 상세 설계
5. **배포 가이드** - NAS 배포 및 클라우드 전환 가이드
