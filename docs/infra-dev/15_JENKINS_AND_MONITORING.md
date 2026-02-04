# Jenkins 설정 시점, 테스트 확인, 모니터링 요약

## 1. Jenkins 설정 시점

**권장: 테스트를 먼저 확인한 뒤 Jenkins 설정**

| 순서 | 작업 | 이유 |
|------|------|------|
| 1 | **테스트 실행·확인** | 프론트/백엔드 테스트가 로컬에서 통과하는지 확인 |
| 2 | **Jenkins 파이프라인 구성** | 빌드 → 테스트 → (배포) 단계를 파이프라인으로 자동화 |
| 3 | **모니터링 도입** | Actuator → Prometheus → Grafana 순으로 단계적 적용 가능 |

- 테스트가 없거나 실패하면 Jenkins가 매번 실패만 반복하게 됩니다.
- 먼저 로컬에서 `npm run test:run`(프론트), `./gradlew test`(백엔드)로 테스트를 통과시킨 뒤, 같은 명령을 Jenkins에서 실행하는 것이 좋습니다.

---

## 2. 테스트 확인 방법

### 프론트엔드 (Vitest)

```bash
cd frontend
npm install
npm run test:run          # 한 번 실행 후 종료
npm run test              # watch 모드 (개발 시)
npm run test:coverage     # 커버리지 리포트
```

- 테스트 파일: `src/**/*.test.ts`
- 통과 여부: 터미널에 `Tests 26 passed` 등으로 표시

### 백엔드 (JUnit 5)

```bash
cd backend
./gradlew test --no-daemon
# Windows: gradlew.bat test --no-daemon
```

- 테스트 리포트: `backend/build/reports/tests/test/index.html`
- 실패 시 위 HTML 또는 터미널 로그로 원인 확인

### 전체 확인 (한 번에)

```bash
# 프로젝트 루트에서
cd frontend && npm run test:run && cd ..
cd backend && ./gradlew test --no-daemon && cd ..
```

---

## 3. 모니터링 방법 요약

프로젝트 설계 문서 기준으로 적용 순서를 정리한 것입니다. 상세는 [09_SPRING_MONITORING.md](09_SPRING_MONITORING.md), [06_DEPLOYMENT_GUIDE.md](../deployment/06_DEPLOYMENT_GUIDE.md)를 참고하세요.

### 3.1 단계별 도입

| 단계 | 도구 | 용도 | 참고 문서 |
|------|------|------|-----------|
| 1 | **Spring Boot Actuator** | 헬스체크, 기본 메트릭 노출 | 09_SPRING_MONITORING.md |
| 2 | **Prometheus** | 메트릭 수집·저장 | [06_DEPLOYMENT_GUIDE.md](../deployment/06_DEPLOYMENT_GUIDE.md), [07_KUBERNETES_DEPLOYMENT.md](../deployment/07_KUBERNETES_DEPLOYMENT.md) |
| 3 | **Grafana** | 대시보드·그래프·알림 | 09_SPRING_MONITORING.md |
| 4 | **ELK / 로그 수집** | 로그 중앙화·검색 (선택) | [01_SYSTEM_ARCHITECTURE.md](../design/01_SYSTEM_ARCHITECTURE.md) |

### 3.2 백엔드 모니터링 (Spring Boot)

1. **Actuator 의존성 추가** (backend/build.gradle)

   ```gradle
   implementation 'org.springframework.boot:spring-boot-starter-actuator'
   implementation 'io.micrometer:micrometer-registry-prometheus'
   ```

2. **application.yml 설정**

   ```yaml
   management:
     endpoints:
       web:
         exposure:
           include: health,info,metrics,prometheus
         base-path: /actuator
     endpoint:
       health:
         show-details: when_authorized
       prometheus:
         enabled: true
   ```

3. **SecurityConfig에서 Actuator 경로 허용**

   - `/actuator/health`, `/actuator/prometheus` 등은 인증 없이 허용하거나, 내부/모니터링 전용 네트워크에서만 접근하도록 제한

4. **확인**

   - 헬스: `GET http://localhost:8080/api/actuator/health`
   - Prometheus 메트릭: `GET http://localhost:8080/api/actuator/prometheus`

### 3.3 모니터링 지표 (설계 문서 기준)

- **애플리케이션**: HTTP 요청 수/지연, JVM 메모리, 스레드, DB 연결
- **비즈니스**: 로그인 수, API 호출 수, 에러율
- **인프라**: CPU, 메모리, 디스크 (Kubernetes/호스트 메트릭)

### 3.4 Grafana 연동

- Prometheus를 Grafana 데이터 소스로 추가
- Spring Boot 메트릭으로 대시보드 생성 (JVM, HTTP 등)
- 자세한 설정·예시: **09_SPRING_MONITORING.md** 8장

---

## 4. Jenkins 파이프라인 예시 (참고)

테스트 확인이 끝난 뒤 Jenkins에서 사용할 수 있는 단순 예시입니다.

```groovy
pipeline {
  agent any
  stages {
    stage('Frontend') {
      steps {
        dir('frontend') {
          sh 'npm ci'
          sh 'npm run test:run'
          sh 'npm run build'
        }
      }
    }
    stage('Backend') {
      steps {
        dir('backend') {
          sh './gradlew test --no-daemon'
          sh './gradlew build -x test'  // 또는 test 포함 빌드
        }
      }
    }
  }
}
```

- 실제로는 노드/도커 에이전트, 빌드 결과물 보관, 배포 단계 등을 추가해 사용하면 됩니다.

---

## 5. 정리

- **Jenkins**: 테스트가 로컬에서 안정적으로 통과한 뒤 설정하는 것을 권장합니다.
- **테스트 확인**: 프론트 `npm run test:run`, 백엔드 `./gradlew test`로 먼저 확인하세요.
- **모니터링**: Actuator → Prometheus → Grafana 순으로 도입하고, 상세는 [09_SPRING_MONITORING.md](09_SPRING_MONITORING.md)와 [06_DEPLOYMENT_GUIDE.md](../deployment/06_DEPLOYMENT_GUIDE.md)를 참고하세요.
