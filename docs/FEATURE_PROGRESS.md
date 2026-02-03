# 기능별 진행 현황

02_REQUIREMENTS.md, 05_UI_UX_DESIGN.md 기준으로 기능별 구현 진행도를 정리한 문서입니다.

---

## 요약

| 구분 | 완료 | 부분 | 미구현 | 비고 |
|------|------|------|--------|------|
| FR-1 인증·사용자 | 2 | 1 | 0 | FR-1.3은 라우트 가드로 인증 필수 적용됨 |
| FR-2 파일 관리 | 4 | 1 | 0 | 검색·폴더 트리 부분 |
| FR-3 마크다운 편집 | 3 | 0 | 0 | - |
| FR-4 파일 보안 | 2 | 0 | 1 | FR-4.3 백엔드 일부 |
| FR-5 사용자 경험 | 4 | 0 | 0 | - |
| FR-6 광고 | 1 | 0 | 0 | - |
| NFR·기타 | - | - | - | 테스트·CI·모니터링 문서 있음 |

---

## FR-1: 인증 및 사용자 관리

| ID | 항목 | 진행 | 상세 |
|----|------|------|------|
| FR-1.1 | Google 로그인 | ✅ 완료 | LoginPage, OAuth 콜백, JWT 저장, AuthController, SecurityConfig |
| FR-1.2 | 사용자별 폴더 관리 | ✅ 완료 | FileService `userDir(userId)`, listFiles, 백엔드 경로 격리 |
| FR-1.3 | 비로그인 뷰어 접근 | ⚠️ 변경됨 | **현재: 라우트 가드로 /viewer·/settings 인증 필수.** 요구사항은 "비로그인 시 뷰어 접근 가능(로컬만)"이므로, 비로그인 허용이 필요하면 가드 완화 검토 |

---

## FR-2: 파일 관리

| ID | 항목 | 진행 | 상세 |
|----|------|------|------|
| FR-2.1 | 파일 목록 조회 | 🔶 부분 | getFileList, Sidebar 연동, **폴더 트리 UI·그룹화 미구현**(평면 목록), 검색(handleSearch) 연결됨 |
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
| FR-4.3 | 안전한 파일 삭제 | 🔶 부분 | 프론트: DeleteFileDialog 옵션 있음. 백엔드: 랜덤 덮어쓰기 1회 후 삭제 (DoD 5220.22-M 다회 덮어쓰기는 미구현) |

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
| 라우트 가드 | ✅ 완료 | App.withAuthGuard, /viewer·/settings 인증 필수, /login 시 이미 로그인하면 /viewer |
| 파일 변경 감지 API | ✅ 완료 | GET /api/files/{path}/check, 200/304, visibility.ts 연동 |
| CI·자동화 | ✅ 완료 | GitHub Actions, scripts/check.ps1, run-dev, Jenkinsfile |
| 테스트 | 🔶 부분 | 프론트 Vitest(client, auth, theme, router), 백엔드 JUnit(Auth, Health, AuthService) |
| 모니터링 | 📄 문서 | 09_SPRING_MONITORING.md, 15_JENKINS_AND_MONITORING.md (Actuator·Prometheus·Grafana) |

---

## 미구현·보완 권장

1. **FR-1.3**: 비로그인 뷰어 접근을 다시 허용할 경우, 라우트 가드에서 `/viewer`만 예외하거나 “비로그인 시 로컬 전용” 플로우 추가 검토.
2. **FR-2.1**: 폴더 트리 구조 표시, 폴더별 그룹화 UI.
3. **FR-4.3**: 안전 삭제를 DoD 5220.22-M 수준으로 확장 시, 백엔드 다회 덮어쓰기 구현.
4. **Phase 2**: 파일 검색 고도화, 폴더 생성/이동/삭제 등 폴더 관리.
5. **Phase 3**: 파일 공유, 협업, 버전 관리 UI, 다크 모드(이미 테마로 구현됨).

---

## 문서 정보

- **기준 문서**: 02_REQUIREMENTS.md, 05_UI_UX_DESIGN.md
- **작성일**: 2026-02-02
- **비고**: 구현 여부는 코드 검색 및 설계 문서 대조 기준이며, 실제 동작은 로컬/배포 환경에서 확인 필요.
