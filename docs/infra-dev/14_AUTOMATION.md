# 시스템 자동화 가이드

이 문서는 Markdown Viewer V2 프로젝트의 **빌드·테스트·실행·배포**를 최대한 자동화하기 위한 방법을 정리합니다.

---

## 1. 자동화 구성 요약

| 구분 | 내용 | 실행 시점 |
|------|------|------------|
| **CI** | GitHub Actions / Jenkins | push, PR 시 자동 |
| **로컬 검사** | `scripts/check.*` | 커밋 전·배포 전 수동 |
| **개발 실행** | `scripts/run-dev.*`, `backend/run.ps1` | 로컬 개발 시 |
| **모니터링** | Actuator, Prometheus, Grafana | 배포 후 (선택) |

---

## 2. CI (지속적 통합)

### 2.1 GitHub Actions

- **파일**: `.github/workflows/ci.yml`
- **트리거**: `main`, `develop` 브랜치에 push 또는 pull_request
- **동작**:
  - **Frontend**: `npm ci` → `lint` → `type-check` → `test:run` → `build`
  - **Backend**: `./gradlew test` → `./gradlew build -x test`

**사용 방법**

- GitHub에 저장소를 푸시하면 자동 실행됩니다.
- Actions 탭에서 실행 이력·로그 확인.

### 2.2 Jenkins

- **파일**: 루트 `Jenkinsfile`
- **동작**: Frontend / Backend 순서로 동일한 검사 후, 성공 시 `frontend/dist`, `backend/build/libs`를 stash에 보관.

**사용 방법**

1. Jenkins에서 새 Pipeline Job 생성
2. "Pipeline from SCM" 선택, 저장소 URL·브랜치 지정
3. "Pipeline script from SCM" → Script Path: `Jenkinsfile`
4. 빌드 시 자동으로 체크아웃 후 위 단계 실행

**참고**: 상세 Jenkins 설정·테스트 확인·모니터링은 **15_JENKINS_AND_MONITORING.md** 참고.

---

## 3. 로컬 통합 검사 (CI와 동일한 검사)

커밋 전·배포 전에 CI와 같은 검사를 로컬에서 한 번에 실행할 때 사용합니다.

### Windows (PowerShell)

```powershell
# 프로젝트 루트에서
.\scripts\check.ps1
```

### Linux / macOS (Bash)

```bash
# 프로젝트 루트에서
chmod +x scripts/check.sh
./scripts/check.sh
```

**실행 내용**

- Frontend: `npm ci`(또는 `npm install`) → `lint` → `type-check` → `test:run`
- Backend: `./gradlew test` (Windows는 `gradlew.bat test`)

하나라도 실패하면 스크립트가 종료됩니다.

**Windows에서 `npm error code EPERM`이 나올 때**

- 다른 터미널·IDE·탐색기에서 `frontend` 폴더를 사용 중이면 닫고 다시 실행하세요.
- 필요하면 PowerShell을 **관리자 권한**으로 실행한 뒤 `.\scripts\check.ps1`을 다시 실행하세요.
- `node_modules`가 이미 있으면 install은 건너뛰고 lint·test만 실행되도록 스크립트가 동작합니다.

---

## 4. 개발 서버 실행

### 4.1 백엔드만 실행 (Windows)

```powershell
cd backend
.\run.ps1
```

- `backend/.env`를 읽어 환경 변수 설정 후 `gradlew.bat bootRun` 실행
- `.env` 없으면 에러 메시지 출력 (`.env.example` 참고)

### 4.2 프론트엔드만 실행

```bash
cd frontend
npm install
npm run dev
```

- Vite 개발 서버 (기본: http://localhost:5173)

### 4.3 백엔드 + 프론트 동시 실행

**Windows**

```powershell
# 프로젝트 루트에서
.\scripts\run-dev.ps1
```

- 백엔드는 **새 PowerShell 창**에서 실행
- 현재 창에서는 프론트엔드 dev 서버 실행
- 종료: 현재 창에서 Ctrl+C(프론트 종료), 백엔드 창에서 Ctrl+C(백엔드 종료)

**Linux / macOS**

```bash
# 프로젝트 루트에서
chmod +x scripts/run-dev.sh
./scripts/run-dev.sh
```

- 백엔드를 백그라운드로 띄운 뒤 프론트 dev 서버 실행
- Ctrl+C 시 두 프로세스 모두 종료

---

## 5. 빌드 (배포용 산출물)

| 대상 | 명령 | 결과물 |
|------|------|--------|
| Frontend | `cd frontend && npm run build` | `frontend/dist/` |
| Backend | `cd backend && ./gradlew build` (또는 `gradlew.bat build`) | `backend/build/libs/*.jar` |

CI에서는 위와 동일한 방식으로 빌드하며, Jenkins는 성공 시 해당 결과물을 stash에 보관합니다.

---

## 6. 모니터링 자동화 (배포 환경)

배포 후 장애 감지·성능 확인을 위해 다음 순서로 도입할 수 있습니다.

1. **Spring Boot Actuator**  
   - 헬스·메트릭 엔드포인트 노출  
   - 설정: **09_SPRING_MONITORING.md**, **15_JENKINS_AND_MONITORING.md** 참고

2. **Prometheus**  
   - Actuator 메트릭 수집·저장  
   - 스크래핑 주기·타겟 설정으로 자동 수집

3. **Grafana**  
   - Prometheus 데이터 소스 연결 후 대시보드·알림 설정  
   - CPU, 메모리, HTTP 지연, 에러율 등 시각화

4. **알림**  
   - Grafana Alert 또는 Prometheus Alertmanager로 슬랙·이메일 등 연동

자세한 설정·엔드포인트는 [09_SPRING_MONITORING.md](09_SPRING_MONITORING.md), [06_DEPLOYMENT_GUIDE.md](../deployment/06_DEPLOYMENT_GUIDE.md), [15_JENKINS_AND_MONITORING.md](15_JENKINS_AND_MONITORING.md)를 참고하세요.

---

## 7. 체크리스트 (자동화 확인용)

- [ ] GitHub 저장소에 푸시 시 Actions에서 CI 성공
- [ ] 로컬에서 `scripts/check.ps1` 또는 `scripts/check.sh` 통과
- [ ] `scripts/run-dev.ps1` 또는 `scripts/run-dev.sh`로 백엔드·프론트 동시 실행 가능
- [ ] (선택) Jenkins Pipeline에서 `Jenkinsfile` 실행 성공
- [ ] (선택) 배포 후 Actuator/Prometheus/Grafana로 모니터링 동작 확인

---

## 8. 관련 문서

- **15_JENKINS_AND_MONITORING.md** — Jenkins 설정 시점, 테스트 확인, 모니터링 요약
- [06_DEPLOYMENT_GUIDE.md](../deployment/06_DEPLOYMENT_GUIDE.md) — 배포 절차·운영
- **09_SPRING_MONITORING.md** — Spring Boot 모니터링 상세
