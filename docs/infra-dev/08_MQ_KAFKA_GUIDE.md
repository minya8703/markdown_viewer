# MQ/Kafka 비동기 처리 가이드

## 문서 정보
- **프로젝트**: 마크다운 뷰어 V2
- **버전**: 1.0
- **작성일**: 2026-01-29
- **목적**: MQ/Kafka를 활용한 비동기 처리 및 스트림 처리 경험

## 목차
1. [개요](#개요)
2. [RabbitMQ 설정](#rabbitmq-설정)
3. [Kafka 설정](#kafka-설정)
4. [비동기 처리 시나리오](#비동기-처리-시나리오)
5. [이벤트 스트리밍](#이벤트-스트리밍)
6. [모니터링 및 운영](#모니터링-및-운영)

---

## 개요

이 가이드는 마크다운 뷰어 V2에서 MQ (RabbitMQ) 및 Kafka를 활용한 비동기 처리 및 스트림 처리 구현 방법을 설명합니다.

### 학습 목표
- 메시지 큐 기반 비동기 처리 패턴 이해
- 이벤트 기반 아키텍처 설계
- 스트림 처리 및 이벤트 소싱 경험
- 대용량 트래픽 처리 최적화

---

## RabbitMQ 설정

### 1. RabbitMQ 배포 (Kubernetes)

**rabbitmq-deployment.yaml:**
```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: rabbitmq
  namespace: markdown-viewer
spec:
  serviceName: rabbitmq
  replicas: 1
  selector:
    matchLabels:
      app: rabbitmq
  template:
    metadata:
      labels:
        app: rabbitmq
    spec:
      containers:
      - name: rabbitmq
        image: rabbitmq:3-management-alpine
        ports:
        - containerPort: 5672
          name: amqp
        - containerPort: 15672
          name: management
        env:
        - name: RABBITMQ_DEFAULT_USER
          value: "admin"
        - name: RABBITMQ_DEFAULT_PASS
          valueFrom:
            secretKeyRef:
              name: rabbitmq-secrets
              key: password
        volumeMounts:
        - name: data
          mountPath: /var/lib/rabbitmq
  volumeClaimTemplates:
  - metadata:
      name: data
    spec:
      accessModes: [ "ReadWriteOnce" ]
      resources:
        requests:
          storage: 10Gi
---
apiVersion: v1
kind: Service
metadata:
  name: rabbitmq
  namespace: markdown-viewer
spec:
  selector:
    app: rabbitmq
  ports:
  - port: 5672
    targetPort: 5672
    name: amqp
  - port: 15672
    targetPort: 15672
    name: management
  type: ClusterIP
```

### 2. Spring Boot RabbitMQ 설정

**application.yml:**
```yaml
spring:
  rabbitmq:
    host: ${RABBITMQ_HOST:rabbitmq}
    port: 5672
    username: ${RABBITMQ_USER:admin}
    password: ${RABBITMQ_PASSWORD}
    listener:
      simple:
        concurrency: 5
        max-concurrency: 10
        prefetch: 10
```

### 3. 큐 및 Exchange 정의

**QueueConfig.java:**
```java
@Configuration
public class QueueConfig {
    
    public static final String FILE_UPLOAD_QUEUE = "file.upload";
    public static final String MARKDOWN_RENDER_QUEUE = "markdown.render";
    public static final String FILE_EVENT_EXCHANGE = "file.events";
    
    @Bean
    public Queue fileUploadQueue() {
        return QueueBuilder.durable(FILE_UPLOAD_QUEUE)
            .withArgument("x-max-priority", 10)
            .build();
    }
    
    @Bean
    public Queue markdownRenderQueue() {
        return QueueBuilder.durable(MARKDOWN_RENDER_QUEUE)
            .build();
    }
    
    @Bean
    public TopicExchange fileEventExchange() {
        return new TopicExchange(FILE_EVENT_EXCHANGE);
    }
}
```

### 4. 메시지 프로듀서

**FileUploadProducer.java:**
```java
@Service
public class FileUploadProducer {
    
    @Autowired
    private RabbitTemplate rabbitTemplate;
    
    public void sendFileUploadTask(FileUploadMessage message) {
        rabbitTemplate.convertAndSend(
            QueueConfig.FILE_UPLOAD_QUEUE,
            message,
            m -> {
                m.getMessageProperties().setPriority(message.getPriority());
                return m;
            }
        );
    }
}
```

### 5. 메시지 컨슈머

**FileUploadConsumer.java:**
```java
@Component
public class FileUploadConsumer {
    
    @RabbitListener(queues = QueueConfig.FILE_UPLOAD_QUEUE)
    public void handleFileUpload(FileUploadMessage message) {
        try {
            // 파일 업로드 처리
            fileService.processUpload(message);
        } catch (Exception e) {
            // 에러 처리 및 재시도 로직
            log.error("File upload failed", e);
            throw new AmqpRejectAndDontRequeueException(e);
        }
    }
}
```

---

## Kafka 설정

### 1. Kafka 배포 (Strimzi Operator 사용)

**kafka-cluster.yaml:**
```yaml
apiVersion: kafka.strimzi.io/v1beta2
kind: Kafka
metadata:
  name: markdown-viewer-kafka
  namespace: markdown-viewer
spec:
  kafka:
    replicas: 3
    listeners:
      - name: plain
        port: 9092
        type: internal
        tls: false
      - name: tls
        port: 9093
        type: internal
        tls: true
    storage:
      type: persistent-claim
      size: 100Gi
      deleteClaim: false
  zookeeper:
    replicas: 3
    storage:
      type: persistent-claim
      size: 20Gi
      deleteClaim: false
```

### 2. Kafka Topic 생성

**kafka-topics.yaml:**
```yaml
apiVersion: kafka.strimzi.io/v1beta2
kind: KafkaTopic
metadata:
  name: file-events
  namespace: markdown-viewer
  labels:
    strimzi.io/cluster: markdown-viewer-kafka
spec:
  partitions: 3
  replicas: 3
  config:
    retention.ms: 604800000  # 7일
    segment.ms: 86400000     # 1일
```

### 3. Spring Boot Kafka 설정

**application.yml:**
```yaml
spring:
  kafka:
    bootstrap-servers: ${KAFKA_BOOTSTRAP_SERVERS:markdown-viewer-kafka-kafka-bootstrap:9092}
    producer:
      key-serializer: org.apache.kafka.common.serialization.StringSerializer
      value-serializer: org.springframework.kafka.support.serializer.JsonSerializer
      acks: all
      retries: 3
    consumer:
      group-id: markdown-viewer-group
      key-deserializer: org.apache.kafka.common.serialization.StringDeserializer
      value-deserializer: org.springframework.kafka.support.serializer.JsonDeserializer
      auto-offset-reset: earliest
      properties:
        spring.json.trusted.packages: "*"
```

### 4. Kafka Producer

**FileEventProducer.java:**
```java
@Service
public class FileEventProducer {
    
    @Autowired
    private KafkaTemplate<String, FileEvent> kafkaTemplate;
    
    private static final String TOPIC = "file-events";
    
    public void sendFileEvent(FileEvent event) {
        kafkaTemplate.send(TOPIC, event.getUserId(), event);
    }
}
```

### 5. Kafka Consumer

**FileEventConsumer.java:**
```java
@Component
public class FileEventConsumer {
    
    @KafkaListener(topics = "file-events", groupId = "markdown-viewer-group")
    public void consumeFileEvent(
        @Payload FileEvent event,
        @Header(KafkaHeaders.RECEIVED_PARTITION_ID) int partition
    ) {
        log.info("Received file event: {} from partition: {}", event, partition);
        
        // 이벤트 처리
        eventService.processFileEvent(event);
    }
}
```

---

## 비동기 처리 시나리오

### 시나리오 1: 파일 업로드 비동기 처리

**흐름:**
```
[사용자 파일 업로드]
  │
  ▼
[API Controller]
  │
  │ 1. 파일 검증 (크기, 형식)
  │ 2. 즉시 응답 반환 (202 Accepted)
  │
  ▼
[RabbitMQ Queue: file.upload]
  │
  ▼
[Worker Process]
  │
  │ 3. 파일 저장
  │ 4. 메타데이터 생성
  │ 5. 인덱싱
  │ 6. 완료 이벤트 발행
  │
  ▼
[WebSocket 또는 Polling으로 사용자에게 알림]
```

### 시나리오 2: 마크다운 렌더링 비동기 처리

**흐름:**
```
[파일 저장 요청]
  │
  ▼
[API Controller]
  │
  │ 1. 원본 파일 저장
  │ 2. 렌더링 작업 큐에 추가
  │
  ▼
[RabbitMQ Queue: markdown.render]
  │
  ▼
[Render Worker]
  │
  │ 3. 마크다운 → HTML 변환
  │ 4. 코드 하이라이팅
  │ 5. 렌더링 결과 캐시 저장
  │
  ▼
[캐시 업데이트 완료]
```

---

## 이벤트 스트리밍

### 이벤트 타입 정의

**FileEvent.java:**
```java
public class FileEvent {
    private String eventType;  // CREATED, UPDATED, DELETED
    private String userId;
    private String filePath;
    private Long timestamp;
    private Map<String, Object> metadata;
}
```

### 이벤트 소싱 패턴

**파일 변경 이벤트 스트림:**
```
[파일 저장]
  │
  ▼
[FileEvent 발행]
  │
  ▼
[Kafka Topic: file-events]
  │
  ├─► [실시간 분석 서비스]
  ├─► [알림 서비스]
  ├─► [검색 인덱스 업데이트]
  └─► [감사 로그 저장]
```

---

## 모니터링 및 운영

### RabbitMQ 모니터링

**Management UI 접근:**
```bash
kubectl port-forward svc/rabbitmq 15672:15672 -n markdown-viewer
# http://localhost:15672 접속
```

**주요 메트릭:**
- 큐 길이 (Queue Length)
- 메시지 처리 속도 (Message Rate)
- Consumer 수
- 연결 수

### Kafka 모니터링

**Kafka Exporter 설정:**
```yaml
apiVersion: kafka.strimzi.io/v1beta2
kind: KafkaExporter
metadata:
  name: kafka-exporter
spec:
  # Prometheus 메트릭 수집
```

**주요 메트릭:**
- Topic 파티션 수
- Consumer Lag
- 메시지 처리 속도
- 브로커 상태

---

## 변경 이력

| 버전 | 날짜 | 변경 내용 | 작성자 |
|------|------|----------|--------|
| 1.0 | 2026-01-29 | 초기 작성 | - |
