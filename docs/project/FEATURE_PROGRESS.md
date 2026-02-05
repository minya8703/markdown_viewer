# 기능별 진행 현황

[11_REQUIREMENTS.md](../10_design/11_REQUIREMENTS.md), [40_UI_UX_DESIGN.md](../40_frontend/40_UI_UX_DESIGN.md) 기준으로 기능별 구현 진행도를 정리한 문서입니다.

---

## 요약

| 구분 | 완료 | 부분 | 미구현 | 비고 |
|------|------|------|--------|------|
| FR-1 인증·사용자 | 3 | 0 | 0 | FR-1.3 비로그인 뷰어 접근 허용 완료 |
| FR-2 파일 관리 | 5 | 0 | 0 | FR-2.1 폴더 트리·그룹화 구현됨 |
| FR-3 마크다운 편집 | 3 | 0 | 0 | - |
| FR-4 파일 보안 | 3 | 0 | 0 | FR-4.3 DoD 5220.22-M 3회 덮어쓰기 완료 |
| FR-5 사용자 경험 | 4 | 0 | 0 | - |
| FR-6 광고 | 1 | 0 | 0 | - |
| NFR·기타 | - | - | - | 테스트·CI·모니터링 문서 있음 |

---

## FR-1: 인증 및 사용자 관리

| ID | 항목 | 진행 | 상세 |
|----|------|------|------|
| FR-1.1 | Google 로그인 | ✅ 완료 | LoginPage, OAuth 콜백, JWT 저장, AuthController, SecurityConfig |
| FR-1.2 | 사용자별 폴더 관리 | ✅ 완료 | FileService `userDir(userId)`, listFiles, 백엔드 경로 격리 |
| FR-1.3 | 비로그인 뷰어 접근 | ✅ 완료 | /viewer 가드 제거, 로그인 없이 뷰어 시작 버튼, 비로그인 시 로컬 파일만 사용·설정/서버 기능 비활성화 |

---

## FR-2: 파일 관리

| ID | 항목 | 진행 | 상세 |
|----|------|------|------|
| FR-2.1 | 파일 목록 조회 | ✅ 완료 | getFileList, Sidebar 연동, 폴더 트리(buildFileTree)·접기/펼치기, 검색(handleSearch) |
| FR-2.2 | 파일 읽기 | ✅ 완료 | readFile, URL ?file=, 마지막 문서 자동 로드, MarkdownRenderer, 코드 하이라이팅(highlight.js) |
| FR-2.3 | 파일 저장 | ✅ 완료 | saveFile, 수동/자동 저장, 저장 상태 표시, AutoSaveManager |
| FR-2.4 | 파일 업로드 | ✅ 완료 | FileUploadDialog, saveFile(upload) API, .md/.markdown, 크기 제한(백엔드 16MB) |
| FR-2.5 | 파일 삭제 | ✅ 완료 | DeleteFileDialog, deleteFile API, 확인 다이얼로그 |

---

## FR-3: 마크다운 편집

| ID | 항목 | 진행 | 상세 |
|----|------|------|------|
| FR-3.1 | 편집 모드 | ✅ 완료 | Editor, Header 편집/저장 버튼, setEditMode, 전체 화면 편집 |
| FR-3.2 | Smart Paste | ✅ 완료 | Editor 내 붙여넣기 처리(마크다운 패턴 인식) |
| FR-3.3 | 편집 종료 | ✅ 완료 | ConfirmCloseDialog, 저장 후/저장 안 함/취소, beforeunload |

---

## FR-4: 파일 보안

| ID | 항목 | 진행 | 상세 |
|----|------|------|------|
| FR-4.1 | 파일 암호화 | ✅ 완료 | EncryptionDialog, DecryptionDialog, AES-256-GCM, PBKDF2, fileEncryption(crypto.ts) |
| FR-4.2 | 로컬 전용 모드 | ✅ 완료 | localFileManager, openLocalFile, saveLocalFile, File System Access API |
| FR-4.3 | 안전한 파일 삭제 | ✅ 완료 | 프론트: DeleteFileDialog 옵션. 백엔드: DoD 5220.22-M 3회 덮어쓰기(0x00→0xFF→랜덤) 후 삭제 |

---

## FR-5: 사용자 경험

| ID | 항목 | 진행 | 상세 |
|----|------|------|------|
| FR-5.1 | 마지막 문서 자동 로드 | ✅ 완료 | getLastDocument API, ViewerPage init 시 loadFile(lastDoc.path) |
| FR-5.2 | 자동 저장 | ✅ 완료 | AutoSaveManager, localStorage 즉시 + 서버 주기 저장, 저장 상태 표시 |
| FR-5.3 | 백그라운드 업데이트 방지 | ✅ 완료 | PageVisibilityManager, 탭 숨김 시 감지 중지/복귀 시 1회 체크, GET /api/files/{path}/check |
| FR-5.4 | 아이콘 기반 UI | ✅ 완료 | Header, Sidebar, Footer 등 Font Awesome 아이콘, 툴팁 |

---

## FR-6: 광고 통합

| ID | 항목 | 진행 | 상세 |
|----|------|------|------|
| FR-6.1 | Google AdSense | ✅ 완료 | index.html 스크립트, Footer 푸터 광고 영역, VITE_ADSENSE_CLIENT_ID |

---

## 기타 구현·설정

| 항목 | 진행 | 상세 |
|------|------|------|
| 설정 화면 | ✅ 완료 | SettingsPage, 자동 저장/편집기/암호화/테마 설정 |
| 테마 (밝음/어둠/자동) | ✅ 완료 | theme.ts, data-theme, variables.css |
| 라우트 가드 | ✅ 완료 | /viewer 비로그인 허용(FR-1.3), /settings만 인증 필수, /login 시 이미 로그인하면 /viewer |
| 파일 변경 감지 API | ✅ 완료 | GET /api/files/{path}/check, 200/304, visibility.ts 연동 |
| CI·자동화 | ✅ 완료 | GitHub Actions, scripts/check.ps1, run-dev, Jenkinsfile |
| 테스트 | ✅ 확장 | 프론트: auth, theme, router, client, **fileService**. 백엔드: Auth, Health, **FileService**, **FileController**, AuthService |
| 모니터링 | 📄 문서 | 61_SPRING_MONITORING.md, 03_JENKINS_AND_MONITORING.md (Actuator·Prometheus·Grafana) |

---

## 미구현·보완 권장

1. ~~**FR-1.3**~~: 완료. 비로그인 뷰어 접근 허용, 로컬 전용 플로우. (이전: 라우트 가드에서 `/viewer`만 예외하거나 “비로그인 시 로컬 전용” 플로우 추가 검토.
2. ~~**FR-2.1**~~: 완료. 폴더 트리·접기/펼치기 구현됨.
3. ~~**FR-4.3**~~: 완료. DoD 5220.22-M 3회 덮어쓰기 구현.
4. **Phase 2**: 파일 검색 고도화, 폴더 생성/이동/삭제 등 폴더 관리.
5. **Phase 3**: 파일 공유, 협업, 버전 관리 UI, 다크 모드(이미 테마로 구현됨).

---

## 문서 정보

- **기준 문서**: [11_REQUIREMENTS.md](../10_design/11_REQUIREMENTS.md), [40_UI_UX_DESIGN.md](../40_frontend/40_UI_UX_DESIGN.md)
- **작성일**: 2026-02-02
- **비고**: 구현 여부는 코드 검색 및 설계 문서 대조 기준이며, 실제 동작은 로컬/배포 환경에서 확인 필요.
