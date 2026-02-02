# MSA 아키텍처 설계 가이드

## 문서 정보
- **프로젝트**: 마크다운 뷰어 V2
- **버전**: 1.0
- **작성일**: 2026-01-29
- **목적**: 작은 프로젝트에서도 MSA 패턴을 경험하기 위한 설계 가이드

## 목차
1. [개요](#개요)
2. [서비스 분리 전략](#서비스-분리-전략)
3. [MSA 아키텍처 구성](#msa-아키텍처-구성)
4. [서비스 간 통신](#서비스-간-통신)
5. [데이터 관리 전략](#데이터-관리-전략)
6. [API Gateway](#api-gateway)
7. [서비스 디스커버리](#서비스-디스커버리)
8. [배포 전략](#배포-전략)

---

## 개요

### 작은 프로젝트에서 MSA 적용하기

프로젝트 규모가 작더라도 **학습 목적**으로 MSA 패턴을 적용할 수 있습니다. 실제로 많은 기업들이 작은 프로젝트에서도 MSA를 연습하고 있습니다.

### MSA 적용의 장점 (학습 관점)

1. **실무 경험**: MSA 패턴 및 기술 스택 경험
2. **독립 배포**: 서비스별 독립 배포 및 스케일링
3. **기술 다양성**: 서비스별 다른 기술 스택 실험 가능
4. **장애 격리**: 한 서비스 장애가 전체에 영향 주지 않음
5. **팀 협업**: 서비스별 팀 분리 가능

### 작은 프로젝트에서의 MSA 전략

**핵심 원칙:**
- **과도한 분리는 피하기**: 3-5개 서비스로 시작
- **명확한 도메인 경계**: 비즈니스 도메인별 분리
- **점진적 분리**: 모놀리식에서 시작해 점진적으로 분리
- **학습 우선**: 완벽한 분리보다는 패턴 경험이 목표

---

## 서비스 분리 전략

### 도메인 분석

현재 프로젝트의 핵심 도메인:

1. **인증 도메인 (Auth Domain)**
   - Google OAuth 인증
   - JWT 토큰 발급/검증
   - 사용자 세션 관리

2. **사용자 도메인 (User Domain)**
   - 사용자 정보 관리
   - 사용자 설정
   - 저장 공간 관리

3. **파일 도메인 (File Domain)**
   - 파일 CRUD 작업
   - 파일 메타데이터 관리
   - 파일 스토리지 관리

4. **마크다운 도메인 (Markdown Domain)**
   - 마크다운 렌더링
   - Smart Paste 감지
   - 코드 하이라이팅

### 서비스 분리 제안

#### 옵션 1: 4개 서비스 (권장 - 학습 목적)

```
┌─────────────────┐
│  API Gateway    │
└────────┬────────┘
         │
    ┌────┴────┬──────────┬─────────────┐
    │         │          │             │
    ▼         ▼          ▼             ▼
┌────────┐ ┌────────┐ ┌──────────┐ ┌─────────────┐
│ Auth   │ │ User   │ │ File    │ │ Markdown   │
│Service │ │Service │ │Service  │ │Service      │
└────────┘ └────────┘ └──────────┘ └─────────────┘
```

**서비스별 책임:**

1. **Auth Service**
   - Google OAuth 처리
   - JWT 토큰 발급/검증
   - 인증/인가 로직

2. **User Service**
   - 사용자 정보 CRUD
   - 사용자 설정 관리
   - 저장 공간 할당량 관리

3. **File Service**
   - 파일 CRUD 작업
   - 파일 메타데이터 관리
   - 파일 스토리지 (NAS/Object Storage) 연동

4. **Markdown Service**
   - 마크다운 → HTML 변환
   - Smart Paste 감지
   - 코드 하이라이팅

#### 옵션 2: 3개 서비스 (최소 구성)

```
┌─────────────────┐
│  API Gateway    │
└────────┬────────┘
         │
    ┌────┴────┬──────────────┐
    │         │              │
    ▼         ▼              ▼
┌────────┐ ┌──────────┐ ┌─────────────┐
│ Auth   │ │ File     │ │ Markdown   │
│Service │ │Service  │ │Service      │
│        │ │(User포함)│ │             │
└────────┘ └──────────┘ └─────────────┘
```

**통합 전략:**
- User Service를 File Service에 통합
- 사용자 정보는 File Service에서 관리

---

## MSA 아키텍처 구성

### 전체 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│                    Client (Frontend)                        │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Gateway                              │
│  - 라우팅                                                  │
│  - 인증 (JWT 검증)                                         │
│  - 로드 밸런싱                                             │
│  - Rate Limiting                                           │
└───────┬───────────┬───────────┬───────────┬─────────────────┘
        │           │           │           │
        ▼           ▼           ▼           ▼
┌───────────┐ ┌───────────┐ ┌───────────┐ ┌──────────────┐
│   Auth    │ │   User    │ │   File    │ │  Markdown   │
│  Service  │ │  Service  │ │  Service  │ │   Service   │
│           │ │           │ │           │ │             │
│ Port:8081 │ │ Port:8082 │ │ Port:8083 │ │ Port:8084   │
└─────┬─────┘ └─────┬─────┘ └─────┬─────┘ └──────┬──────┘
      │             │             │              │
      ▼             ▼             ▼              ▼
┌───────────┐ ┌───────────┐ ┌───────────┐ ┌──────────────┐
│  Auth DB  │ │  User DB  │ │  File DB  │ │  (Stateless)│
│ (Postgres)│ │ (Postgres)│ │ (Postgres)│ │             │
└───────────┘ └───────────┘ └───────────┘ └──────────────┘
      │             │             │              │
      │             │             │              │
      └─────────────┴─────────────┴──────────────┘
                      │
                      ▼
            ┌─────────────────┐
            │  Message Queue  │
            │  (RabbitMQ/     │
            │   Kafka)        │
            └─────────────────┘
                      │
        ┌─────────────┼─────────────┐
        │             │             │
        ▼             ▼             ▼
  ┌─────────┐  ┌─────────┐  ┌─────────┐
  │  File   │  │  User   │  │  Event  │
  │ Storage │  │ Storage │  │ Handler │
  └─────────┘  └─────────┘  └─────────┘
```

### 서비스별 상세 구성

#### 1. Auth Service

**책임:**
- Google OAuth 인증 처리
- JWT 토큰 발급 및 검증
- 사용자 인증 상태 관리

**기술 스택:**
- Spring Boot
- Spring Security
- Spring OAuth2 Client
- JWT (jjwt)

**데이터베이스:**
- PostgreSQL (인증 토큰, 세션 정보)

**API 엔드포인트:**
```
POST   /api/auth/google/login
GET    /api/auth/google/callback
POST   /api/auth/logout
GET    /api/auth/validate
POST   /api/auth/refresh
```

#### 2. User Service

**책임:**
- 사용자 정보 관리
- 사용자 설정 관리
- 저장 공간 할당량 관리

**기술 스택:**
- Spring Boot
- Spring Data JPA
- PostgreSQL

**데이터베이스:**
- PostgreSQL (users, user_preferences 테이블)

**API 엔드포인트:**
```
GET    /api/users/me
PUT    /api/users/me
GET    /api/users/me/last-document
GET    /api/users/me/storage
```

#### 3. File Service

**책임:**
- 파일 CRUD 작업
- 파일 메타데이터 관리
- 파일 스토리지 연동

**기술 스택:**
- Spring Boot
- Spring Data JPA
- File System / Object Storage

**데이터베이스:**
- PostgreSQL (file_metadata 테이블)

**API 엔드포인트:**
```
GET    /api/files
GET    /api/files/{path}
POST   /api/files/{path}
DELETE /api/files/{path}
GET    /api/files/{path}/check
POST   /api/files/upload
```

#### 4. Markdown Service

**책임:**
- 마크다운 → HTML 변환
- Smart Paste 감지
- 코드 하이라이팅

**기술 스택:**
- Spring Boot
- Flexmark-java / CommonMark
- (Stateless - DB 불필요)

**API 엔드포인트:**
```
POST   /api/markdown/render
POST   /api/markdown/detect
```

---

## 서비스 간 통신

### 1. 동기 통신 (REST API)

**사용 사례:**
- 즉시 응답이 필요한 작업
- 파일 읽기, 사용자 정보 조회

**구현:**
```java
// Feign Client 사용
@FeignClient(name = "user-service", url = "${user.service.url}")
public interface UserServiceClient {
    
    @GetMapping("/api/users/{userId}")
    User getUser(@PathVariable String userId);
    
    @GetMapping("/api/users/{userId}/storage")
    StorageInfo getStorageInfo(@PathVariable String userId);
}
```

**설정:**
```yaml
# application.yml
user:
  service:
    url: http://user-service:8082

feign:
  client:
    config:
      default:
        connectTimeout: 5000
        readTimeout: 5000
  circuitbreaker:
    enabled: true
```

### 2. 비동기 통신 (Message Queue)

**사용 사례:**
- 파일 업로드 처리
- 마크다운 렌더링 작업
- 이벤트 발행

**이벤트 예시:**
```java
// FileCreatedEvent
public class FileCreatedEvent {
    private String userId;
    private String filePath;
    private Long fileSize;
    private LocalDateTime createdAt;
}

// UserService에서 FileService로 이벤트 발행
@EventListener
public void handleFileCreated(FileCreatedEvent event) {
    // 사용자 저장 공간 업데이트
    userService.updateStorageUsage(event.getUserId(), event.getFileSize());
}
```

### 3. 서킷 브레이커 패턴

**Resilience4j 사용:**
```java
@Service
public class UserServiceClient {
    
    @CircuitBreaker(name = "userService", fallbackMethod = "getUserFallback")
    @Retry(name = "userService")
    @TimeLimiter(name = "userService")
    public CompletableFuture<User> getUser(String userId) {
        return CompletableFuture.supplyAsync(() -> 
            userServiceClient.getUser(userId)
        );
    }
    
    public CompletableFuture<User> getUserFallback(String userId, Exception ex) {
        // 캐시에서 조회 또는 기본값 반환
        return CompletableFuture.completedFuture(getCachedUser(userId));
    }
}
```

---

## 데이터 관리 전략

### Database per Service 패턴

**각 서비스별 독립 데이터베이스:**

```
Auth Service    → auth_db (PostgreSQL)
User Service    → user_db (PostgreSQL)
File Service    → file_db (PostgreSQL)
Markdown Service → (Stateless, DB 불필요)
```

### 데이터 일관성 전략

#### 1. Saga 패턴 (분산 트랜잭션)

**예시: 파일 삭제 시 사용자 저장 공간 업데이트**

```
[File Service: 파일 삭제]
  │
  │ 1. 파일 삭제
  │ 2. FileDeletedEvent 발행
  │
  ▼
[RabbitMQ/Kafka]
  │
  ▼
[User Service: 저장 공간 업데이트]
  │
  │ 3. 저장 공간 사용량 감소
  │
  ├─ [성공] ──► [완료]
  │
  └─ [실패] ──► [보상 트랜잭션]
                  - 파일 복구 또는
                  - 수동 조정 필요 알림
```

#### 2. Event Sourcing (선택적)

**파일 변경 이벤트 저장:**
```java
// FileEventStore
public class FileEventStore {
    private List<FileEvent> events = new ArrayList<>();
    
    public void append(FileEvent event) {
        events.add(event);
        // Kafka로 발행
        kafkaTemplate.send("file-events", event);
    }
    
    public FileState getCurrentState(String filePath) {
        return events.stream()
            .filter(e -> e.getFilePath().equals(filePath))
            .reduce(FileState.initial(), FileState::apply);
    }
}
```

### 데이터 동기화

**CQRS 패턴 (선택적):**
- Command: File Service에서 파일 변경
- Query: User Service에서 파일 목록 조회 (읽기 전용 복제본)

---

## API Gateway

### 역할

1. **단일 진입점**: 클라이언트는 API Gateway만 호출
2. **라우팅**: 요청을 적절한 서비스로 라우팅
3. **인증/인가**: JWT 토큰 검증
4. **로드 밸런싱**: 여러 인스턴스 간 부하 분산
5. **Rate Limiting**: API 호출 제한
6. **로깅 및 모니터링**: 모든 요청 로깅

### 구현 옵션

#### 옵션 1: Spring Cloud Gateway (권장)

**의존성:**
```xml
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-gateway</artifactId>
</dependency>
```

**설정:**
```yaml
spring:
  cloud:
    gateway:
      routes:
      - id: auth-service
        uri: http://auth-service:8081
        predicates:
        - Path=/api/auth/**
        filters:
        - StripPrefix=1
      
      - id: user-service
        uri: http://user-service:8082
        predicates:
        - Path=/api/users/**
        filters:
        - StripPrefix=1
        - name: RequestHeader
          args:
            header: Authorization
            value: Bearer {token}
      
      - id: file-service
        uri: http://file-service:8083
        predicates:
        - Path=/api/files/**
        filters:
        - StripPrefix=1
      
      - id: markdown-service
        uri: http://markdown-service:8084
        predicates:
        - Path=/api/markdown/**
        filters:
        - StripPrefix=1
```

#### 옵션 2: Kong 또는 Nginx + Lua

**Kong 사용:**
```yaml
# kong.yml
services:
  - name: auth-service
    url: http://auth-service:8081
    routes:
      - name: auth-route
        paths:
          - /api/auth
```

### 인증 필터

**JWT 검증:**
```java
@Component
public class JwtAuthenticationFilter implements GatewayFilter {
    
    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String token = extractToken(exchange.getRequest());
        
        if (token == null) {
            return unauthorized(exchange);
        }
        
        // Auth Service에 토큰 검증 요청
        return validateToken(token)
            .flatMap(valid -> {
                if (valid) {
                    return chain.filter(exchange);
                } else {
                    return unauthorized(exchange);
                }
            });
    }
}
```

---

## 서비스 디스커버리

### 옵션 1: Kubernetes Service Discovery (권장)

**Kubernetes 환경에서는 Service Discovery 자동 제공:**
```yaml
# user-service.yaml
apiVersion: v1
kind: Service
metadata:
  name: user-service
spec:
  selector:
    app: user-service
  ports:
  - port: 8082
    targetPort: 8082
```

**서비스 간 통신:**
```java
// Kubernetes DNS 사용
String userServiceUrl = "http://user-service:8082/api/users";
```

### 옵션 2: Eureka (Spring Cloud)

**Eureka Server 설정:**
```java
@SpringBootApplication
@EnableEurekaServer
public class EurekaServerApplication {
    public static void main(String[] args) {
        SpringApplication.run(EurekaServerApplication.class, args);
    }
}
```

**Eureka Client 설정:**
```yaml
eureka:
  client:
    service-url:
      defaultZone: http://eureka-server:8761/eureka/
```

**Feign Client with Eureka:**
```java
@FeignClient(name = "user-service")
public interface UserServiceClient {
    @GetMapping("/api/users/{userId}")
    User getUser(@PathVariable String userId);
}
```

---

## 배포 전략

### 모놀리식에서 MSA로 전환

#### Phase 1: 모놀리식 (시작)
```
[Monolithic Application]
  - 모든 기능 포함
  - 단일 배포
```

#### Phase 2: 모듈화 (준비)
```
[Monolithic Application]
  ├── auth-module
  ├── user-module
  ├── file-module
  └── markdown-module
```

#### Phase 3: 서비스 분리 (점진적)
```
[API Gateway]
  ├── [Auth Service] (먼저 분리)
  └── [Monolithic] (나머지)
```

#### Phase 4: 완전한 MSA
```
[API Gateway]
  ├── Auth Service
  ├── User Service
  ├── File Service
  └── Markdown Service
```

### Kubernetes 배포

**각 서비스별 Deployment:**
```yaml
# auth-service-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: auth-service
spec:
  replicas: 2
  selector:
    matchLabels:
      app: auth-service
  template:
    metadata:
      labels:
        app: auth-service
    spec:
      containers:
      - name: auth-service
        image: markdown-viewer/auth-service:latest
        ports:
        - containerPort: 8081
        env:
        - name: SPRING_PROFILES_ACTIVE
          value: "kubernetes"
```

---

## 작은 프로젝트에서의 MSA 실전 팁

### 1. 과도한 분리 피하기

**❌ 나쁜 예:**
- 너무 많은 서비스 (10개 이상)
- 명확한 경계 없는 분리
- 불필요한 복잡성

**✅ 좋은 예:**
- 3-5개 서비스로 시작
- 명확한 도메인 경계
- 점진적 분리

### 2. 공통 라이브러리 활용

**공유 모듈:**
```
shared-lib/
├── common-models/      # 공통 DTO
├── common-utils/       # 유틸리티
└── common-config/     # 공통 설정
```

**각 서비스에서 의존성으로 사용:**
```xml
<dependency>
    <groupId>com.markdownviewer</groupId>
    <artifactId>shared-lib</artifactId>
    <version>1.0.0</version>
</dependency>
```

### 3. 개발 환경 단순화

**Docker Compose로 로컬 개발:**
```yaml
version: '3.8'
services:
  api-gateway:
    build: ./api-gateway
    ports:
      - "8080:8080"
  
  auth-service:
    build: ./auth-service
    ports:
      - "8081:8081"
  
  user-service:
    build: ./user-service
    ports:
      - "8082:8082"
  
  file-service:
    build: ./file-service
    ports:
      - "8083:8083"
  
  markdown-service:
    build: ./markdown-service
    ports:
      - "8084:8084"
  
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: auth_db
    ports:
      - "5432:5432"
  
  rabbitmq:
    image: rabbitmq:3-management
    ports:
      - "5672:5672"
      - "15672:15672"
```

### 4. 테스트 전략

**서비스별 독립 테스트:**
- 단위 테스트: 각 서비스 내부 로직
- 통합 테스트: 서비스 + DB
- 계약 테스트: 서비스 간 API 계약 (Pact)

**E2E 테스트:**
- Testcontainers로 전체 환경 구성
- API Gateway를 통한 전체 플로우 테스트

---

## 모니터링 및 관찰성

### 분산 추적

**각 서비스에 Trace ID 전파:**
```java
// HTTP 헤더로 Trace ID 전파
@Bean
public RestTemplate restTemplate() {
    return new RestTemplateBuilder()
        .additionalInterceptors((request, body, execution) -> {
            String traceId = MDC.get("traceId");
            request.getHeaders().add("X-Trace-Id", traceId);
            return execution.execute(request, body);
        })
        .build();
}
```

### 로그 집계

**각 서비스 로그에 서비스명 포함:**
```yaml
logging:
  pattern:
    console: "%d{yyyy-MM-dd HH:mm:ss} [%thread] [%X{traceId}] [SERVICE:auth-service] %-5level %logger{36} - %msg%n"
```

---

## 변경 이력

| 버전 | 날짜 | 변경 내용 | 작성자 |
|------|------|----------|--------|
| 1.0 | 2026-01-29 | 초기 작성 | - |
