# 배포 가이드

## 문서 정보
- **프로젝트**: 마크다운 뷰어 V2
- **버전**: 1.0
- **작성일**: 2026-01-29
- **기반 문서**: SYSTEM_ARCHITECTURE.md

## 목차
1. [개요](#개요)
2. [NAS 배포](#nas-배포)
3. [클라우드 전환](#클라우드-전환)
4. [운영 가이드](#운영-가이드)
5. [모니터링](#모니터링)
6. [백업 및 복구](#백업-및-복구)

---

## 개요

### 배포 전략
1. **Phase 1**: NAS 배포 (초기)
2. **Phase 2**: 클라우드 전환 (확장 시)

### 시스템 요구사항

#### 최소 요구사항
- **CPU**: 2 cores
- **RAM**: 2GB
- **Storage**: 10GB (애플리케이션 + 데이터)
- **OS**: Linux (Ubuntu 20.04+ 또는 Debian 11+)

#### 권장 요구사항
- **CPU**: 4 cores
- **RAM**: 4GB
- **Storage**: 50GB+
- **OS**: Linux (Ubuntu 22.04 LTS)

---

## NAS 배포

### 1. 사전 준비

#### 필요한 소프트웨어
- Docker & Docker Compose
- Nginx
- Git

#### 네트워크 설정
- 포트 포워딩 설정 (80, 443)
- 도메인 설정 (선택적, Let's Encrypt 사용 시)

### 2. 프로젝트 클론 및 설정

```bash
# 프로젝트 클론
git clone https://github.com/your-repo/markdown-viewer-v2.git
cd markdown-viewer-v2

# 환경 변수 설정
cp .env.example .env
nano .env
```

**.env 파일 예시:**
```env
# 애플리케이션 설정
APP_NAME=Markdown Viewer
APP_ENV=production
APP_PORT=8080

# 데이터베이스 설정 (MariaDB 권장)
DB_TYPE=mariadb
DB_HOST=localhost
DB_PORT=3306
DB_NAME=markdown_viewer
DB_USER=markdown_user
DB_PASSWORD=secure_password

# 또는 SQLite (개발/테스트용)
# DB_TYPE=sqlite
# DB_PATH=/data/markdown_viewer.db

# 또는 PostgreSQL (대안 - 고급 기능 필요 시)
# DB_TYPE=postgresql
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=markdown_viewer
# DB_USER=markdown_user
# DB_PASSWORD=secure_password

# Google OAuth 설정
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=https://your-domain.com/api/auth/google/callback

# JWT 설정
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRATION=86400

# 파일 저장 경로
FILE_STORAGE_PATH=/data/users

# AdSense 설정 (선택적)
ADSENSE_PUBLISHER_ID=your_publisher_id
ADSENSE_AD_UNIT_ID=your_ad_unit_id
```

### 3. Docker Compose 설정

**docker-compose.yml:**
```yaml
version: '3.8'

services:
  app:
    build: .
    container_name: markdown-viewer-app
    ports:
      - "8080:8080"
    volumes:
      - ./data:/data
      - ./logs:/app/logs
    environment:
      - SPRING_PROFILES_ACTIVE=production
    restart: unless-stopped
    networks:
      - markdown-viewer-network

  nginx:
    image: nginx:alpine
    container_name: markdown-viewer-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
      - ./static:/usr/share/nginx/html/static
    depends_on:
      - app
    restart: unless-stopped
    networks:
      - markdown-viewer-network

networks:
  markdown-viewer-network:
    driver: bridge

volumes:
  data:
  logs:
```

### 4. Nginx 설정

**nginx/nginx.conf:**
```nginx
user nginx;
worker_processes auto;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # 로그 설정
    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log;

    # Gzip 압축
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;

    # 업스트림 설정
    upstream app {
        server app:8080;
    }

    # HTTP 서버 (HTTPS로 리다이렉트)
    server {
        listen 80;
        server_name your-domain.com;

        # Let's Encrypt 인증
        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
        }

        # HTTPS로 리다이렉트
        location / {
            return 301 https://$server_name$request_uri;
        }
    }

    # HTTPS 서버
    server {
        listen 443 ssl http2;
        server_name your-domain.com;

        # SSL 인증서
        ssl_certificate /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;

        # SSL 설정
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;
        ssl_prefer_server_ciphers on;

        # 정적 파일
        location /static/ {
            alias /usr/share/nginx/html/static/;
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        # API 프록시
        location /api/ {
            proxy_pass http://app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # 프론트엔드
        location / {
            proxy_pass http://app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

### 5. SSL 인증서 설정 (Let's Encrypt)

```bash
# Certbot 설치
sudo apt-get update
sudo apt-get install certbot

# 인증서 발급
sudo certbot certonly --standalone -d your-domain.com

# 인증서를 Docker 볼륨에 복사
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem ./nginx/ssl/
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem ./nginx/ssl/

# 자동 갱신 설정
sudo certbot renew --dry-run
```

### 6. 애플리케이션 빌드 및 실행

```bash
# Docker 이미지 빌드
docker-compose build

# 컨테이너 시작
docker-compose up -d

# 로그 확인
docker-compose logs -f app
```

### 7. 초기 설정 확인

```bash
# 컨테이너 상태 확인
docker-compose ps

# 데이터베이스 초기화 확인
docker-compose exec app ls -la /data

# 파일 시스템 권한 설정
docker-compose exec app chmod -R 700 /data/users
```

---

## 클라우드 전환

### 1. 클라우드 플랫폼 선택

#### 옵션 1: Naver Cloud Platform (NCP)
- 한국 리전 지원
- 저렴한 가격
- 한국어 지원

#### 옵션 2: AWS
- 글로벌 인프라
- 다양한 서비스
- 높은 안정성

#### 옵션 3: Google Cloud Platform (GCP)
- Google 서비스 통합 용이
- Kubernetes 지원

### 2. 마이그레이션 계획

#### 단계 1: 데이터 백업
```bash
# NAS에서 데이터 백업
tar -czf backup-$(date +%Y%m%d).tar.gz /data

# 데이터베이스 백업
pg_dump -U markdown_user markdown_viewer > db_backup.sql
```

#### 단계 2: 클라우드 인프라 구축
- 가상 머신 생성
- 네트워크 설정
- 스토리지 설정
- 로드 밸런서 설정

#### 단계 3: 애플리케이션 배포
- Docker 이미지 빌드 및 푸시
- Kubernetes 배포 (선택적)
- 환경 변수 설정

#### 단계 4: 데이터 마이그레이션
- 백업 데이터 복원
- 데이터베이스 마이그레이션
- 파일 시스템 마이그레이션

#### 단계 5: DNS 전환
- DNS 레코드 업데이트
- 점진적 트래픽 전환

### 3. Kubernetes 배포 (권장 - 확장성 및 운영 경험)

#### 3.1 Kubernetes 클러스터 구성

**필요한 컴포넌트:**
- Kubernetes 1.24+ (GKE, EKS, AKS 또는 온프레미스)
- Ingress Controller (Nginx)
- PersistentVolume (파일 스토리지)
- ConfigMap & Secrets (설정 관리)

#### 3.2 애플리케이션 배포

**deployment.yaml:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: markdown-viewer-api
  labels:
    app: markdown-viewer
    component: api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: markdown-viewer
      component: api
  template:
    metadata:
      labels:
        app: markdown-viewer
        component: api
    spec:
      containers:
      - name: app
        image: your-registry/markdown-viewer:latest
        ports:
        - containerPort: 8080
          name: http
        env:
        - name: SPRING_PROFILES_ACTIVE
          value: "production"
        - name: REDIS_HOST
          valueFrom:
            configMapKeyRef:
              name: app-config
              key: redis.host
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: db.password
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /actuator/health
            port: 8080
          initialDelaySeconds: 60
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /actuator/health/readiness
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: markdown-viewer-api
spec:
  selector:
    app: markdown-viewer
    component: api
  ports:
  - port: 80
    targetPort: 8080
  type: ClusterIP
```

#### 3.3 오토스케일링 설정

**hpa.yaml:**
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: markdown-viewer-api-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: markdown-viewer-api
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 50
        periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 0
      policies:
      - type: Percent
        value: 100
        periodSeconds: 15
      - type: Pods
        value: 2
        periodSeconds: 15
      selectPolicy: Max
```

#### 3.4 Ingress 설정

**ingress.yaml:**
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: markdown-viewer-ingress
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
spec:
  tls:
  - hosts:
    - markdown-viewer.example.com
    secretName: markdown-viewer-tls
  rules:
  - host: markdown-viewer.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: markdown-viewer-api
            port:
              number: 80
```

#### 3.5 Redis 클러스터 배포

**redis-statefulset.yaml:**
```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: redis-cluster
spec:
  serviceName: redis
  replicas: 3
  selector:
    matchLabels:
      app: redis
  template:
    metadata:
      labels:
        app: redis
    spec:
      containers:
      - name: redis
        image: redis:7-alpine
        ports:
        - containerPort: 6379
        volumeMounts:
        - name: data
          mountPath: /data
  volumeClaimTemplates:
  - metadata:
      name: data
    spec:
      accessModes: [ "ReadWriteOnce" ]
      resources:
        requests:
          storage: 10Gi
```

#### 3.6 MQ/Kafka 배포

**RabbitMQ 배포 (옵션 1):**
```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: rabbitmq
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
```

**Kafka 배포 (옵션 2):**
```yaml
# Kafka는 보통 Operator를 사용하거나 Helm Chart 활용
# 예: Strimzi Operator 또는 Confluent Operator
```

#### 3.7 모니터링 설정

**Prometheus ServiceMonitor:**
```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: markdown-viewer-metrics
spec:
  selector:
    matchLabels:
      app: markdown-viewer
  endpoints:
  - port: http
    path: /actuator/prometheus
    interval: 30s
```

---

## 운영 가이드

### 1. 일상 운영

#### 로그 확인
```bash
# 애플리케이션 로그
docker-compose logs -f app

# Nginx 로그
docker-compose logs -f nginx

# 시스템 로그
journalctl -u markdown-viewer -f
```

#### 상태 확인
```bash
# 컨테이너 상태
docker-compose ps

# 리소스 사용량
docker stats

# 디스크 사용량
df -h
```

### 2. 업데이트 절차

```bash
# 1. 백업
./scripts/backup.sh

# 2. 코드 업데이트
git pull origin main

# 3. 이미지 재빌드
docker-compose build

# 4. 컨테이너 재시작
docker-compose up -d

# 5. 상태 확인
docker-compose ps
curl http://localhost/api/health
```

### 3. 문제 해결

#### 컨테이너가 시작되지 않을 때
```bash
# 로그 확인
docker-compose logs app

# 컨테이너 재시작
docker-compose restart app

# 완전 재시작
docker-compose down
docker-compose up -d
```

#### 디스크 공간 부족
```bash
# 사용량 확인
du -sh /data/*

# 오래된 로그 삭제
find /data/logs -name "*.log" -mtime +30 -delete

# Docker 이미지 정리
docker system prune -a
```

---

## 모니터링

### 1. Spring Boot Actuator 설정

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

### 2. Prometheus 연동

**의존성 추가:**
```xml
<dependency>
    <groupId>io.micrometer</groupId>
    <artifactId>micrometer-registry-prometheus</artifactId>
</dependency>
```

**메트릭 확인:**
```bash
curl http://localhost:8080/actuator/prometheus
```

### 3. 주요 메트릭

#### 애플리케이션 메트릭
- `http.server.requests`: HTTP 요청 수 및 응답 시간
- `file.operations`: 파일 작업 수 (read/write/delete)
- `markdown.render.duration`: 마크다운 렌더링 시간
- `file.save.duration`: 파일 저장 시간

#### 인프라 메트릭
- `jvm.memory.used`: JVM 메모리 사용량
- `jvm.gc.pause`: GC 일시정지 시간
- `process.cpu.usage`: CPU 사용률
- `process.uptime`: 애플리케이션 가동 시간

### 4. 로그 모니터링

#### 로그 레벨 설정
```yaml
logging:
  level:
    root: INFO
    com.markdownviewer: DEBUG
  file:
    path: /app/logs
    max-size: 10MB
    max-history: 30
  pattern:
    console: "%d{yyyy-MM-dd HH:mm:ss} - %msg%n"
    file: "%d{yyyy-MM-dd HH:mm:ss} [%thread] %-5level %logger{36} - %msg%n"
```

#### 구조화된 로깅 (JSON)
프로덕션 환경에서는 JSON 형식으로 로그 출력하여 ELK Stack으로 수집

### 5. 알림 설정

#### 주요 알림 항목
- 서비스 다운 (Health Check 실패)
- 디스크 사용량 80% 초과
- 메모리 사용량 90% 초과
- 에러율 5% 초과
- 응답 시간 p95가 2초 초과

**자세한 내용은 [Spring 모니터링 가이드](./09_SPRING_MONITORING.md) 참고**

---

## 백업 및 복구

### 1. 백업 전략

#### 자동 백업 스크립트
```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/backup"
DATE=$(date +%Y%m%d_%H%M%S)

# 데이터베이스 백업
pg_dump -U markdown_user markdown_viewer > $BACKUP_DIR/db_$DATE.sql

# 파일 시스템 백업
tar -czf $BACKUP_DIR/files_$DATE.tar.gz /data/users

# 오래된 백업 삭제 (30일 이상)
find $BACKUP_DIR -name "*.sql" -mtime +30 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete
```

#### Cron 설정
```cron
# 매일 새벽 2시에 백업
0 2 * * * /path/to/backup.sh
```

### 2. 복구 절차

#### 데이터베이스 복구
```bash
# 백업 파일 확인
ls -lh /backup/db_*.sql

# 데이터베이스 복구
psql -U markdown_user markdown_viewer < /backup/db_20260129_020000.sql
```

#### 파일 시스템 복구
```bash
# 백업 파일 확인
ls -lh /backup/files_*.tar.gz

# 파일 시스템 복구
tar -xzf /backup/files_20260129_020000.tar.gz -C /
```

---

## 보안 체크리스트

### 1. 네트워크 보안
- [ ] HTTPS 강제 (TLS 1.2+)
- [ ] 방화벽 규칙 설정
- [ ] 불필요한 포트 닫기
- [ ] SSH 키 기반 인증

### 2. 애플리케이션 보안
- [ ] 환경 변수로 민감 정보 관리
- [ ] JWT 시크릿 키 강력하게 설정
- [ ] 파일 업로드 검증
- [ ] SQL Injection 방지

### 3. 데이터 보안
- [ ] 데이터베이스 백업 암호화
- [ ] 파일 시스템 권한 설정
- [ ] 정기적인 보안 업데이트

---

## 변경 이력

| 버전 | 날짜 | 변경 내용 | 작성자 |
|------|------|----------|--------|
| 1.0 | 2026-01-29 | 초기 작성 | - |
