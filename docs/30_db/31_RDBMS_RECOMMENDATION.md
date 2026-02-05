# RDBMS 선택 가이드

## 문서 정보
- **프로젝트**: 마크다운 뷰어 V2
- **버전**: 1.0
- **작성일**: 2026-01-29
- **목적**: 프로젝트 특성에 맞는 RDBMS 선택 및 구성 가이드

## 목차
1. [프로젝트 특성 분석](#프로젝트-특성-분석)
2. [RDBMS 옵션 비교](#rdbms-옵션-비교)
3. [단계별 추천](#단계별-추천)
4. [MSA 환경에서의 데이터베이스 전략](#msa-환경에서의-데이터베이스-전략)
5. [구현 가이드](#구현-가이드)

---

## 프로젝트 특성 분석

### 데이터 특성
- **데이터 규모**: 중소규모 (사용자 1000-5000명)
- **트랜잭션**: 읽기 중심 (80% 읽기, 20% 쓰기)
- **데이터 복잡도**: 낮음-중간 (관계형 구조, 복잡한 조인 없음)
- **동시성**: 중간 (1000명 동시 사용자)

### 아키텍처 요구사항
- **MSA 적용**: Database per Service 패턴
- **독립 배포**: 서비스별 독립 DB
- **확장성**: 수평 확장 가능
- **Kubernetes 배포**: 컨테이너 환경

### 운영 요구사항
- **학습 목적**: 다양한 기능 경험
- **비용**: 오픈소스 우선
- **운영 편의성**: 관리 도구 및 커뮤니티 지원

---

## RDBMS 옵션 비교

### 1. MariaDB (권장 ⭐⭐⭐⭐⭐)

**장점:**
- ✅ **오픈소스**: 완전한 오픈소스 (MySQL과 달리 Oracle 소유 아님)
- ✅ **간단한 설정**: 초기 설정이 쉬움, 빠른 프로토타이핑
- ✅ **성능**: 읽기 성능 우수, 읽기 중심 워크로드에 최적화
- ✅ **안정성**: MySQL과 호환되며 검증된 안정성
- ✅ **커뮤니티**: 큰 커뮤니티, 풍부한 자료
- ✅ **Spring Boot 통합**: 완벽 지원
- ✅ **Kubernetes 지원**: StatefulSet으로 쉽게 배포
- ✅ **MSA 친화적**: 서비스별 독립 DB 구성 용이

**단점:**
- ❌ 복잡한 쿼리에서 PostgreSQL보다 느림
- ❌ JSON 타입 지원이 PostgreSQL보다 제한적
- ❌ 확장 기능이 제한적

**적합한 경우:**
- 간단한 CRUD 중심 (현재 프로젝트에 적합)
- 빠른 프로토타이핑 및 개발
- 읽기 중심 워크로드
- MSA 환경 (Database per Service)

**성능:**
- 동시 연결: 수천 개
- 읽기 성능: 우수
- 쓰기 성능: 우수
- 복제: Master-Slave Replication

---

### 2. PostgreSQL (대안 - 고급 기능 필요 시 ⭐⭐⭐⭐)

**장점:**
- ✅ **오픈소스**: 무료, 강력한 커뮤니티
- ✅ **기능 풍부**: JSON 타입, Full-Text Search, 확장 기능 (PostGIS, pg_trgm 등)
- ✅ **성능**: 대용량 데이터 처리 우수, 복잡한 쿼리 최적화
- ✅ **안정성**: ACID 준수, 트랜잭션 지원
- ✅ **확장성**: 읽기 전용 복제본, 샤딩 지원
- ✅ **Kubernetes 지원**: StatefulSet으로 쉽게 배포
- ✅ **MSA 친화적**: 서비스별 독립 DB 구성 용이
- ✅ **Spring Boot 통합**: Spring Data JPA 완벽 지원

**단점:**
- ❌ 초기 설정이 MariaDB보다 약간 복잡
- ❌ 메모리 사용량이 MariaDB보다 높음

**적합한 경우:**
- 복잡한 쿼리 및 분석 필요
- JSON 데이터 저장 필요
- Full-Text Search 필요
- 확장성 중요

**성능:**
- 동시 연결: 수천 개
- 읽기 성능: 매우 우수
- 쓰기 성능: 우수
- 복제: Streaming Replication (비동기/동기)

---

### 3. SQLite (개발/테스트용 ⭐⭐⭐)

**장점:**
- ✅ **간단함**: 파일 기반, 설정 불필요
- ✅ **경량**: 리소스 사용량 최소
- ✅ **빠른 개발**: 프로토타이핑에 적합

**단점:**
- ❌ 동시 쓰기 제한 (1개)
- ❌ 네트워크 접근 불가
- ❌ MSA 환경 부적합
- ❌ 프로덕션 부적합

**적합한 경우:**
- 로컬 개발 환경
- 단위 테스트
- 소규모 프로토타입

---

### 4. H2 (개발/테스트용 ⭐⭐)

**장점:**
- ✅ **인메모리**: 빠른 테스트
- ✅ **Java 네이티브**: JVM에서 직접 실행
- ✅ **설정 불필요**: Spring Boot 자동 설정

**단점:**
- ❌ 프로덕션 부적합
- ❌ 데이터 영속성 제한

**적합한 경우:**
- 단위 테스트
- 통합 테스트
- 로컬 개발 (임시)

---

## 단계별 추천

### Phase 1: 개발 단계 (현재)

**추천: MariaDB 10.11**

**이유:**
- 프로덕션과 유사한 환경
- Docker로 쉽게 구성 가능
- 빠른 개발 및 배포
- MSA 전환 시 마이그레이션 용이

**구성:**
```yaml
# docker-compose.yml
services:
  mariadb:
    image: mariadb:10.11
    environment:
      MYSQL_DATABASE: markdown_viewer
      MYSQL_USER: markdown_user
      MYSQL_PASSWORD: ${DB_PASSWORD}
      MYSQL_ROOT_PASSWORD: ${ROOT_PASSWORD}
    ports:
      - "3306:3306"
    volumes:
      - mariadb_data:/var/lib/mysql
    command: --character-set-server=utf8mb4 --collation-server=utf8mb4_unicode_ci

volumes:
  mariadb_data:
```

---

### Phase 2: MSA 전환 단계

**추천: MariaDB 10.11 (각 서비스별 독립 DB)**

**구성:**
```
Auth Service    → auth_db (MariaDB)
User Service    → user_db (MariaDB)
File Service    → file_db (MariaDB)
Markdown Service → (Stateless, DB 불필요)
```

**이유:**
- Database per Service 패턴
- 서비스별 독립 스케일링
- 장애 격리
- 간단한 설정 및 운영

**Kubernetes 배포:**
```yaml
# mariadb-statefulset.yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: auth-db
spec:
  serviceName: auth-db
  replicas: 1
  selector:
    matchLabels:
      app: auth-db
  template:
    metadata:
      labels:
        app: auth-db
    spec:
      containers:
      - name: mariadb
        image: mariadb:10.11
        env:
        - name: MYSQL_DATABASE
          value: auth_db
        - name: MYSQL_USER
          valueFrom:
            secretKeyRef:
              name: db-secrets
              key: username
        - name: MYSQL_PASSWORD
          valueFrom:
            secretKeyRef:
              name: db-secrets
              key: password
        - name: MYSQL_ROOT_PASSWORD
          valueFrom:
            secretKeyRef:
              name: db-secrets
              key: root-password
        ports:
        - containerPort: 3306
          name: mysql
        volumeMounts:
        - name: data
          mountPath: /var/lib/mysql
        command:
        - mariadbd
        - --character-set-server=utf8mb4
        - --collation-server=utf8mb4_unicode_ci
  volumeClaimTemplates:
  - metadata:
      name: data
    spec:
      accessModes: [ "ReadWriteOnce" ]
      resources:
        requests:
          storage: 20Gi
```

---

### Phase 3: 확장 단계 (대용량 트래픽)

**추천: MariaDB + 읽기 전용 복제본**

**구성:**
```
[Master] MariaDB (쓰기)
    │
    ├─► [Replica 1] MariaDB (읽기)
    ├─► [Replica 2] MariaDB (읽기)
    └─► [Replica 3] MariaDB (읽기)
```

**이유:**
- 읽기 부하 분산
- 고가용성 (HA)
- 장애 복구

---

## MSA 환경에서의 데이터베이스 전략

### Database per Service 패턴

**각 서비스별 독립 데이터베이스:**

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ Auth Service │     │ User Service │     │ File Service │
│              │     │              │     │              │
│  auth_db     │     │  user_db     │     │  file_db      │
│ (PostgreSQL) │     │ (PostgreSQL) │     │ (PostgreSQL)  │
└──────────────┘     └──────────────┘     └──────────────┘
```

**장점:**
- 서비스별 독립 배포 및 스케일링
- 기술 스택 다양화 가능
- 장애 격리
- 데이터 소유권 명확

**도전 과제:**
- 분산 트랜잭션 처리
- 데이터 일관성 관리
- 서비스 간 조인 불가

**해결 방법:**
- Saga 패턴 (분산 트랜잭션)
- 이벤트 기반 아키텍처
- API 조합 (BFF 패턴)

---

## 구현 가이드

### 1. MariaDB 설정 (권장)

#### Docker Compose 설정

**docker-compose.yml:**
```yaml
version: '3.8'

services:
  # Auth Service DB
  auth-db:
    image: mariadb:10.11
    container_name: auth-db
    environment:
      MYSQL_DATABASE: auth_db
      MYSQL_USER: auth_user
      MYSQL_PASSWORD: ${AUTH_DB_PASSWORD}
      MYSQL_ROOT_PASSWORD: ${ROOT_PASSWORD}
    ports:
      - "3306:3306"
    volumes:
      - auth_db_data:/var/lib/mysql
    command: --character-set-server=utf8mb4 --collation-server=utf8mb4_unicode_ci
    healthcheck:
      test: ["CMD", "healthcheck.sh", "--connect", "--innodb_initialized"]
      interval: 10s
      timeout: 5s
      retries: 5

  # User Service DB
  user-db:
    image: mariadb:10.11
    container_name: user-db
    environment:
      MYSQL_DATABASE: user_db
      MYSQL_USER: user_user
      MYSQL_PASSWORD: ${USER_DB_PASSWORD}
      MYSQL_ROOT_PASSWORD: ${ROOT_PASSWORD}
    ports:
      - "3307:3306"
    volumes:
      - user_db_data:/var/lib/mysql
    command: --character-set-server=utf8mb4 --collation-server=utf8mb4_unicode_ci
    healthcheck:
      test: ["CMD", "healthcheck.sh", "--connect", "--innodb_initialized"]
      interval: 10s
      timeout: 5s
      retries: 5

  # File Service DB
  file-db:
    image: mariadb:10.11
    container_name: file-db
    environment:
      MYSQL_DATABASE: file_db
      MYSQL_USER: file_user
      MYSQL_PASSWORD: ${FILE_DB_PASSWORD}
      MYSQL_ROOT_PASSWORD: ${ROOT_PASSWORD}
    ports:
      - "3308:3306"
    volumes:
      - file_db_data:/var/lib/mysql
    command: --character-set-server=utf8mb4 --collation-server=utf8mb4_unicode_ci
    healthcheck:
      test: ["CMD", "healthcheck.sh", "--connect", "--innodb_initialized"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  auth_db_data:
  user_db_data:
  file_db_data:
```

#### Spring Boot 설정

**application.yml (Auth Service):**
```yaml
spring:
  datasource:
    url: jdbc:mariadb://auth-db:3306/auth_db?useSSL=false&serverTimezone=Asia/Seoul&characterEncoding=UTF-8
    username: ${DB_USERNAME:auth_user}
    password: ${DB_PASSWORD}
    driver-class-name: org.mariadb.jdbc.Driver
    hikari:
      maximum-pool-size: 10
      minimum-idle: 5
      connection-timeout: 30000
      idle-timeout: 600000
      max-lifetime: 1800000
      connection-test-query: SELECT 1
  
  jpa:
    hibernate:
      ddl-auto: validate  # 프로덕션: validate, 개발: update
    show-sql: false
    properties:
      hibernate:
        dialect: org.hibernate.dialect.MariaDBDialect
        format_sql: true
        jdbc:
          batch_size: 20
        order_inserts: true
        order_updates: true
        use_sql_comments: true
```

#### 의존성 추가

**pom.xml:**
```xml
<dependencies>
    <!-- MariaDB Driver -->
    <dependency>
        <groupId>org.mariadb.jdbc</groupId>
        <artifactId>mariadb-java-client</artifactId>
        <version>3.3.0</version>
    </dependency>
    
    <!-- Spring Data JPA -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-jpa</artifactId>
    </dependency>
    
    <!-- Connection Pool (HikariCP - 기본 포함) -->
    <!-- 추가 설정 불필요 -->
</dependencies>
```

**build.gradle:**
```gradle
dependencies {
    // MariaDB Driver
    implementation 'org.mariadb.jdbc:mariadb-java-client:3.3.0'
    
    // Spring Data JPA
    implementation 'org.springframework.boot:spring-boot-starter-data-jpa'
}
```

---

### 2. PostgreSQL 설정 (대안 - 고급 기능 필요 시)

#### Docker Compose 설정

```yaml
services:
  auth-db:
    image: postgres:15-alpine
    container_name: auth-db
    environment:
      POSTGRES_DB: auth_db
      POSTGRES_USER: auth_user
      POSTGRES_PASSWORD: ${AUTH_DB_PASSWORD}
    ports:
      - "5432:5432"
    volumes:
      - auth_db_data:/var/lib/postgresql/data
```

#### Spring Boot 설정

```yaml
spring:
  datasource:
    url: jdbc:postgresql://auth-db:5432/auth_db
    username: ${DB_USERNAME:auth_user}
    password: ${DB_PASSWORD}
    driver-class-name: org.postgresql.Driver
```

---

## 최종 추천

### 🏆 선택: MariaDB

**이유:**
1. **오픈소스**: 완전한 오픈소스 (MySQL과 달리 Oracle 소유 아님)
2. **간단한 설정**: 초기 설정이 쉬움, 빠른 프로토타이핑
3. **안정성**: MySQL과 호환되며 검증된 안정성
4. **성능**: 읽기 중심 워크로드에 최적화
5. **MSA 지원**: Database per Service 패턴 적용 가능
6. **Kubernetes 지원**: StatefulSet 배포 용이
7. **학습 가치**: 실무에서 널리 사용
8. **커뮤니티**: 활발한 커뮤니티 지원

### 🥈 대안: PostgreSQL

**이유:**
1. **기능 풍부**: JSON 타입, Full-Text Search 등 고급 기능
2. **복잡한 쿼리**: 분석 쿼리에 강점
3. **확장성**: 읽기 복제본, 샤딩 지원이 더 강력

**MariaDB가 더 적합한 이유:**
- 프로젝트가 비교적 단순한 CRUD 중심
- 빠른 개발 및 배포가 중요
- MySQL 호환성으로 기존 도구/라이브러리 활용 가능

---

## 데이터베이스별 특징 비교

| 특징 | MariaDB | PostgreSQL | SQLite |
|------|---------|-----------|--------|
| **오픈소스** | ✅ | ✅ | ✅ |
| **MSA 적합성** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ❌ |
| **확장성** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ❌ |
| **성능** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **기능 풍부도** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| **Kubernetes 지원** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| **학습 가치** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| **설정 복잡도** | 쉬움 | 중간 | 매우 쉬움 |
| **현재 프로젝트 적합도** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ |

---

## 프로젝트별 추천 구성

### 현재 프로젝트 (마크다운 뷰어 V2)

**추천: MariaDB**

**구성:**
```
개발 환경:
  - MariaDB 10.11 (Docker)
  - 각 서비스별 독립 DB

프로덕션 환경:
  - MariaDB 10.11 (Kubernetes StatefulSet)
  - 읽기 전용 복제본 (확장 시)
  - 백업 자동화
```

**이유:**
1. **간단한 설정**: 빠른 개발 및 배포
2. **MSA 지원**: Database per Service 패턴 적용 가능
3. **안정성**: 검증된 안정적인 DB
4. **성능**: 읽기 중심 워크로드에 최적화
5. **학습 목적**: 실무에서 널리 사용
6. **Kubernetes 배포 용이**: StatefulSet 지원
7. **오픈소스**: 완전한 오픈소스 (비용 부담 없음)

---

## 마이그레이션 전략

### SQLite → MariaDB

**단계 1: 데이터 추출**
```bash
# SQLite 데이터 덤프
sqlite3 markdown_viewer.db .dump > dump.sql
```

**단계 2: MariaDB 변환**
```bash
# MariaDB로 임포트 (스키마 수정 필요)
mysql -u markdown_user -p markdown_viewer < dump.sql
```

**단계 3: 애플리케이션 설정 변경**
```yaml
# application.yml
spring:
  datasource:
    url: jdbc:mariadb://localhost:3306/markdown_viewer?useSSL=false&serverTimezone=Asia/Seoul&characterEncoding=UTF-8
    driver-class-name: org.mariadb.jdbc.Driver
```

---

## 성능 최적화 팁

### MariaDB 최적화

**1. 커넥션 풀 설정**
```yaml
spring:
  datasource:
    hikari:
      maximum-pool-size: 20
      minimum-idle: 10
      connection-timeout: 30000
```

**2. 인덱스 최적화**
```sql
-- 자주 조회되는 컬럼에 인덱스
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_file_metadata_user_path ON file_metadata(user_id, file_path);
CREATE INDEX idx_file_metadata_last_modified ON file_metadata(user_id, last_modified DESC);
```

**3. 쿼리 최적화**
```sql
-- EXPLAIN ANALYZE로 쿼리 분석
EXPLAIN ANALYZE 
SELECT * FROM file_metadata 
WHERE user_id = ? 
ORDER BY last_modified DESC 
LIMIT 10;
```

**4. VACUUM 및 ANALYZE**
```sql
-- 정기적으로 실행 (cron job)
VACUUM ANALYZE;
```

---

## 모니터링

### MariaDB 모니터링

**느린 쿼리 로그 활성화:**
```sql
-- 느린 쿼리 로그 설정
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 1;  -- 1초 이상 쿼리 로깅
SET GLOBAL slow_query_log_file = '/var/log/mysql/slow-query.log';
```

**성능 스키마 활용:**
```sql
-- 활성화된 쿼리 확인
SELECT 
    thread_id,
    sql_text,
    timer_start,
    timer_end,
    (timer_end - timer_start) / 1000000000000 as duration_seconds
FROM performance_schema.events_statements_current
WHERE sql_text IS NOT NULL
ORDER BY duration_seconds DESC
LIMIT 10;
```

**상태 확인:**
```sql
-- 연결 수 확인
SHOW STATUS LIKE 'Threads_connected';

-- 쿼리 통계
SHOW STATUS LIKE 'Questions';
SHOW STATUS LIKE 'Slow_queries';

-- 테이블 상태
SHOW TABLE STATUS FROM markdown_viewer;
```

**Prometheus Exporter:**
```yaml
# mysqld-exporter
services:
  mariadb-exporter:
    image: prom/mysqld-exporter
    environment:
      DATA_SOURCE_NAME: "markdown_user:password@(mariadb:3306)/markdown_viewer"
    ports:
      - "9104:9104"
```

---

## 변경 이력

| 버전 | 날짜 | 변경 내용 | 작성자 |
|------|------|----------|--------|
| 1.0 | 2026-01-29 | 초기 작성 | - |
