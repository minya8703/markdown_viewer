# Spring Boot 모니터링 가이드

## 문서 정보
- **프로젝트**: 마크다운 뷰어 V2
- **버전**: 1.0
- **작성일**: 2026-01-29
- **목적**: Spring Boot 애플리케이션 모니터링 및 관찰성 확보

## 목차
1. [개요](#개요)
2. [Spring Boot Actuator 설정](#spring-boot-actuator-설정)
3. [Micrometer 및 Prometheus 연동](#micrometer-및-prometheus-연동)
4. [Health Checks](#health-checks)
5. [Custom Metrics](#custom-metrics)
6. [Distributed Tracing](#distributed-tracing)
7. [로그 관리](#로그-관리)
8. [Grafana 대시보드](#grafana-대시보드)

---

## 개요

Spring Boot 애플리케이션의 모니터링 및 관찰성을 확보하기 위한 설정 가이드입니다. 실무에서 요구되는 모니터링 경험을 쌓기 위한 실습 가이드입니다.

### 학습 목표
- Spring Boot Actuator 활용
- Micrometer를 통한 메트릭 수집
- Prometheus 연동 및 메트릭 노출
- Custom Metrics 구현
- Health Checks 커스터마이징
- Distributed Tracing 설정
- 로그 구조화 및 중앙 집중식 수집

---

## Spring Boot Actuator 설정

### 1. 의존성 추가

**pom.xml:**
```xml
<dependencies>
    <!-- Spring Boot Actuator -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-actuator</artifactId>
    </dependency>
    
    <!-- Micrometer Prometheus -->
    <dependency>
        <groupId>io.micrometer</groupId>
        <artifactId>micrometer-registry-prometheus</artifactId>
    </dependency>
    
    <!-- Micrometer Tracing (선택적) -->
    <dependency>
        <groupId>io.micrometer</groupId>
        <artifactId>micrometer-tracing-bridge-brave</artifactId>
    </dependency>
    
    <dependency>
        <groupId>io.zipkin.reporter2</groupId>
        <artifactId>zipkin-reporter-brave</artifactId>
    </dependency>
</dependencies>
```

**build.gradle:**
```gradle
dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-actuator'
    implementation 'io.micrometer:micrometer-registry-prometheus'
    implementation 'io.micrometer:micrometer-tracing-bridge-brave'
    implementation 'io.zipkin.reporter2:zipkin-reporter-brave'
}
```

### 2. Actuator 설정

**application.yml:**
```yaml
management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,prometheus,env,loggers
      base-path: /actuator
  endpoint:
    health:
      show-details: always
      probes:
        enabled: true
    metrics:
      enabled: true
    prometheus:
      enabled: true
  metrics:
    export:
      prometheus:
        enabled: true
    tags:
      application: ${spring.application.name}
      environment: ${spring.profiles.active}
    distribution:
      percentiles-histogram:
        http.server.requests: true
      percentiles:
        http.server.requests: 0.5, 0.9, 0.95, 0.99
  health:
    livenessState:
      enabled: true
    readinessState:
      enabled: true
    diskspace:
      enabled: true
    db:
      enabled: true
    redis:
      enabled: true
```

### 3. 보안 설정

**SecurityConfig.java:**
```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {
    
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/actuator/health", "/actuator/health/liveness", 
                                 "/actuator/health/readiness", "/actuator/prometheus")
                    .permitAll()
                .requestMatchers("/actuator/**")
                    .hasRole("ADMIN")
                .anyRequest()
                    .authenticated()
            );
        return http.build();
    }
}
```

---

## Micrometer 및 Prometheus 연동

### 1. Prometheus 메트릭 노출

**PrometheusConfig.java:**
```java
@Configuration
public class PrometheusConfig {
    
    @Bean
    public MeterRegistryCustomizer<MeterRegistry> metricsCommonTags() {
        return registry -> registry.config()
            .commonTags(
                "application", "markdown-viewer",
                "environment", System.getProperty("spring.profiles.active", "default")
            );
    }
}
```

### 2. 기본 메트릭 확인

**주요 메트릭:**
- `http.server.requests`: HTTP 요청 수 및 응답 시간
- `jvm.memory.used`: JVM 메모리 사용량
- `jvm.gc.pause`: GC 일시정지 시간
- `process.cpu.usage`: CPU 사용률
- `process.uptime`: 애플리케이션 가동 시간

**메트릭 확인:**
```bash
curl http://localhost:8080/actuator/prometheus
```

---

## Health Checks

### 1. 기본 Health Checks

**자동으로 제공되는 Health Indicators:**
- `DiskSpaceHealthIndicator`: 디스크 공간
- `DataSourceHealthIndicator`: 데이터베이스 연결
- `RedisHealthIndicator`: Redis 연결

### 2. Custom Health Indicator

**FileSystemHealthIndicator.java:**
```java
@Component
public class FileSystemHealthIndicator implements HealthIndicator {
    
    @Value("${file.storage.path}")
    private String storagePath;
    
    @Override
    public Health health() {
        try {
            Path path = Paths.get(storagePath);
            if (!Files.exists(path)) {
                return Health.down()
                    .withDetail("error", "Storage path does not exist")
                    .build();
            }
            
            long freeSpace = Files.getFileStore(path).getUsableSpace();
            long totalSpace = Files.getFileStore(path).getTotalSpace();
            double usagePercent = (1 - (double) freeSpace / totalSpace) * 100;
            
            if (usagePercent > 90) {
                return Health.down()
                    .withDetail("usage", String.format("%.2f%%", usagePercent))
                    .withDetail("freeSpace", formatBytes(freeSpace))
                    .build();
            }
            
            return Health.up()
                .withDetail("usage", String.format("%.2f%%", usagePercent))
                .withDetail("freeSpace", formatBytes(freeSpace))
                .withDetail("totalSpace", formatBytes(totalSpace))
                .build();
        } catch (IOException e) {
            return Health.down()
                .withDetail("error", e.getMessage())
                .build();
        }
    }
    
    private String formatBytes(long bytes) {
        return String.format("%.2f GB", bytes / (1024.0 * 1024.0 * 1024.0));
    }
}
```

### 3. Liveness 및 Readiness Probes

**Kubernetes에서 사용:**
```yaml
livenessProbe:
  httpGet:
    path: /actuator/health/liveness
    port: 8080
  initialDelaySeconds: 60
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /actuator/health/readiness
    port: 8080
  initialDelaySeconds: 30
  periodSeconds: 5
```

---

## Custom Metrics

### 1. Counter (카운터)

**FileMetrics.java:**
```java
@Service
public class FileMetrics {
    
    private final Counter fileReadCounter;
    private final Counter fileWriteCounter;
    private final Counter fileDeleteCounter;
    
    public FileMetrics(MeterRegistry meterRegistry) {
        this.fileReadCounter = Counter.builder("file.operations")
            .description("Number of file read operations")
            .tag("operation", "read")
            .register(meterRegistry);
            
        this.fileWriteCounter = Counter.builder("file.operations")
            .description("Number of file write operations")
            .tag("operation", "write")
            .register(meterRegistry);
            
        this.fileDeleteCounter = Counter.builder("file.operations")
            .description("Number of file delete operations")
            .tag("operation", "delete")
            .register(meterRegistry);
    }
    
    public void incrementFileRead() {
        fileReadCounter.increment();
    }
    
    public void incrementFileWrite() {
        fileWriteCounter.increment();
    }
    
    public void incrementFileDelete() {
        fileDeleteCounter.increment();
    }
}
```

### 2. Gauge (게이지)

**StorageMetrics.java:**
```java
@Component
public class StorageMetrics {
    
    private final Gauge storageUsageGauge;
    private final Gauge fileCountGauge;
    
    @Autowired
    private FileService fileService;
    
    public StorageMetrics(MeterRegistry meterRegistry, FileService fileService) {
        this.fileService = fileService;
        
        this.storageUsageGauge = Gauge.builder("storage.usage.bytes")
            .description("Total storage usage in bytes")
            .register(meterRegistry, this, StorageMetrics::getStorageUsage);
            
        this.fileCountGauge = Gauge.builder("storage.file.count")
            .description("Total number of files")
            .register(meterRegistry, this, StorageMetrics::getFileCount);
    }
    
    private double getStorageUsage() {
        return fileService.getTotalStorageUsage();
    }
    
    private double getFileCount() {
        return fileService.getTotalFileCount();
    }
}
```

### 3. Timer (타이머)

**MarkdownMetrics.java:**
```java
@Service
public class MarkdownMetrics {
    
    private final Timer markdownRenderTimer;
    private final Timer fileSaveTimer;
    
    public MarkdownMetrics(MeterRegistry meterRegistry) {
        this.markdownRenderTimer = Timer.builder("markdown.render.duration")
            .description("Time taken to render markdown")
            .publishPercentiles(0.5, 0.9, 0.95, 0.99)
            .register(meterRegistry);
            
        this.fileSaveTimer = Timer.builder("file.save.duration")
            .description("Time taken to save file")
            .publishPercentiles(0.5, 0.9, 0.95, 0.99)
            .register(meterRegistry);
    }
    
    public Timer.Sample startRenderTimer() {
        return Timer.start();
    }
    
    public void stopRenderTimer(Timer.Sample sample) {
        sample.stop(markdownRenderTimer);
    }
    
    public <T> T recordFileSave(Supplier<T> operation) {
        return fileSaveTimer.record(operation);
    }
}
```

### 4. 사용 예시

**FileService.java:**
```java
@Service
public class FileService {
    
    @Autowired
    private FileMetrics fileMetrics;
    
    @Autowired
    private MarkdownMetrics markdownMetrics;
    
    public FileContent readFile(String path) {
        fileMetrics.incrementFileRead();
        // 파일 읽기 로직
    }
    
    public void saveFile(String path, String content) {
        markdownMetrics.recordFileSave(() -> {
            // 파일 저장 로직
            return null;
        });
        fileMetrics.incrementFileWrite();
    }
    
    public String renderMarkdown(String content) {
        Timer.Sample sample = markdownMetrics.startRenderTimer();
        try {
            // 마크다운 렌더링 로직
            return renderedHtml;
        } finally {
            markdownMetrics.stopRenderTimer(sample);
        }
    }
}
```

---

## Distributed Tracing

### 1. Micrometer Tracing 설정

**application.yml:**
```yaml
management:
  tracing:
    sampling:
      probability: 1.0  # 프로덕션에서는 0.1 정도로 설정
  zipkin:
    tracing:
      endpoint: http://zipkin:9411/api/v2/spans
```

### 2. Custom Span 생성

**FileService.java:**
```java
@Service
public class FileService {
    
    @Autowired
    private Tracer tracer;
    
    public FileContent readFile(String path) {
        Span span = tracer.nextSpan()
            .name("file.read")
            .tag("file.path", path)
            .start();
        
        try (Tracer.SpanInScope ws = tracer.withSpanInScope(span)) {
            // 파일 읽기 로직
            span.tag("file.size", String.valueOf(fileSize));
            return fileContent;
        } catch (Exception e) {
            span.tag("error", true);
            span.tag("error.message", e.getMessage());
            throw e;
        } finally {
            span.end();
        }
    }
}
```

### 3. HTTP 요청 추적

**WebConfig.java:**
```java
@Configuration
public class WebConfig implements WebMvcConfigurer {
    
    @Bean
    public FilterRegistrationBean<TracingFilter> tracingFilter() {
        FilterRegistrationBean<TracingFilter> registration = 
            new FilterRegistrationBean<>(new TracingFilter());
        registration.setOrder(Ordered.HIGHEST_PRECEDENCE);
        return registration;
    }
}
```

---

## 로그 관리

### 1. Logback 설정

**logback-spring.xml:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
    <include resource="org/springframework/boot/logging/logback/defaults.xml"/>
    
    <springProfile name="production">
        <appender name="JSON" class="ch.qos.logback.core.rolling.RollingFileAppender">
            <file>logs/application.json</file>
            <encoder class="net.logstash.logback.encoder.LoggingEventCompositeJsonEncoder">
                <providers>
                    <timestamp/>
                    <version/>
                    <logLevel/>
                    <message/>
                    <mdc/>
                    <stackTrace/>
                </providers>
            </encoder>
            <rollingPolicy class="ch.qos.logback.core.rolling.TimeBasedRollingPolicy">
                <fileNamePattern>logs/application-%d{yyyy-MM-dd}.json</fileNamePattern>
                <maxHistory>30</maxHistory>
            </rollingPolicy>
        </appender>
        
        <root level="INFO">
            <appender-ref ref="JSON"/>
        </root>
    </springProfile>
    
    <springProfile name="!production">
        <appender name="CONSOLE" class="ch.qos.logback.core.ConsoleAppender">
            <encoder>
                <pattern>%d{yyyy-MM-dd HH:mm:ss} - %msg%n</pattern>
            </encoder>
        </appender>
        
        <root level="DEBUG">
            <appender-ref ref="CONSOLE"/>
        </root>
    </springProfile>
</configuration>
```

### 2. 구조화된 로깅

**FileService.java:**
```java
@Service
@Slf4j
public class FileService {
    
    public FileContent readFile(String userId, String path) {
        MDC.put("userId", userId);
        MDC.put("filePath", path);
        
        try {
            log.info("Reading file", 
                kv("operation", "read"),
                kv("fileSize", fileSize)
            );
            
            // 파일 읽기 로직
            
            log.info("File read successfully",
                kv("operation", "read"),
                kv("duration", duration)
            );
            
            return fileContent;
        } catch (Exception e) {
            log.error("Failed to read file",
                kv("operation", "read"),
                kv("error", e.getMessage()),
                e
            );
            throw e;
        } finally {
            MDC.clear();
        }
    }
}
```

---

## Grafana 대시보드

### 1. Prometheus 데이터 소스 설정

Grafana에서 Prometheus를 데이터 소스로 추가:
- URL: `http://prometheus:9090`
- Access: Server (default)

### 2. 주요 대시보드 메트릭

**애플리케이션 메트릭:**
- HTTP 요청 수 (requests/sec)
- HTTP 응답 시간 (p50, p95, p99)
- 에러율 (%)
- JVM 메모리 사용량
- GC 일시정지 시간
- 파일 작업 수 (read/write/delete)
- 마크다운 렌더링 시간
- 파일 저장 시간

**인프라 메트릭:**
- CPU 사용률
- 메모리 사용률
- 디스크 사용률
- 네트워크 트래픽

### 3. 대시보드 예시 쿼리

**HTTP 요청 수:**
```promql
rate(http_server_requests_seconds_count[5m])
```

**HTTP 응답 시간 (p95):**
```promql
histogram_quantile(0.95, 
  rate(http_server_requests_seconds_bucket[5m])
)
```

**에러율:**
```promql
rate(http_server_requests_seconds_count{status=~"5.."}[5m]) 
/ 
rate(http_server_requests_seconds_count[5m])
```

**파일 작업 수:**
```promql
rate(file_operations_total[5m])
```

---

## 알림 설정

### 1. Alertmanager 설정

**alertmanager.yml:**
```yaml
route:
  group_by: ['alertname', 'cluster', 'service']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 12h
  receiver: 'web.hook'
receivers:
- name: 'web.hook'
  webhook_configs:
  - url: 'http://alert-webhook:5001/'
```

### 2. Prometheus Alert Rules

**alerts.yml:**
```yaml
groups:
- name: markdown_viewer_alerts
  rules:
  - alert: HighErrorRate
    expr: rate(http_server_requests_seconds_count{status=~"5.."}[5m]) > 0.05
    for: 5m
    labels:
      severity: critical
    annotations:
      summary: "High error rate detected"
      
  - alert: HighResponseTime
    expr: histogram_quantile(0.95, rate(http_server_requests_seconds_bucket[5m])) > 2
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "High response time detected"
      
  - alert: HighMemoryUsage
    expr: jvm_memory_used_bytes / jvm_memory_max_bytes > 0.9
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "High memory usage detected"
```

---

## 운영 팁

### 1. 메트릭 수집 최적화

- 불필요한 메트릭 비활성화
- 샘플링 비율 조정
- 메트릭 카드니얼리티 관리

### 2. 로그 레벨 관리

- 프로덕션: INFO 레벨
- 개발: DEBUG 레벨
- 특정 패키지만 DEBUG: `logging.level.com.markdownviewer: DEBUG`

### 3. 성능 영향 최소화

- 비동기 로깅 사용
- 메트릭 수집 간격 조정
- 트레이싱 샘플링 비율 조정

---

## 변경 이력

| 버전 | 날짜 | 변경 내용 | 작성자 |
|------|------|----------|--------|
| 1.0 | 2026-01-29 | 초기 작성 | - |
