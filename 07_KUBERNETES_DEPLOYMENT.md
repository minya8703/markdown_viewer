# Kubernetes 배포 가이드

## 문서 정보
- **프로젝트**: 마크다운 뷰어 V2
- **버전**: 1.0
- **작성일**: 2026-01-29
- **목적**: Kubernetes 운영 및 개발 경험을 위한 상세 가이드

## 목차
1. [개요](#개요)
2. [Kubernetes 클러스터 준비](#kubernetes-클러스터-준비)
3. [애플리케이션 배포](#애플리케이션-배포)
4. [서비스 메시 및 네트워킹](#서비스-메시-및-네트워킹)
5. [스토리지 관리](#스토리지-관리)
6. [오토스케일링](#오토스케일링)
7. [모니터링 및 로깅](#모니터링-및-로깅)
8. [운영 및 트러블슈팅](#운영-및-트러블슈팅)

---

## 개요

이 가이드는 마크다운 뷰어 V2를 Kubernetes 환경에 배포하고 운영하는 방법을 설명합니다. 실무에서 요구되는 Kubernetes 운영 경험을 쌓기 위한 실습 가이드입니다.

### 학습 목표
- Kubernetes 기본 개념 이해 및 실습
- Deployment, Service, Ingress 구성
- StatefulSet을 활용한 상태 유지 애플리케이션 배포
- Horizontal Pod Autoscaler (HPA) 설정
- ConfigMap과 Secrets 관리
- PersistentVolume 및 StorageClass 활용
- 모니터링 및 로깅 설정

---

## Kubernetes 클러스터 준비

### 옵션 1: 클라우드 관리형 Kubernetes

#### Google Kubernetes Engine (GKE)
```bash
# 클러스터 생성
gcloud container clusters create markdown-viewer-cluster \
  --num-nodes=3 \
  --machine-type=e2-medium \
  --zone=asia-northeast3-a \
  --enable-autoscaling \
  --min-nodes=2 \
  --max-nodes=5
```

#### Amazon EKS
```bash
# EKS 클러스터 생성
eksctl create cluster \
  --name markdown-viewer-cluster \
  --region ap-northeast-2 \
  --nodegroup-name standard-workers \
  --node-type t3.medium \
  --nodes 3 \
  --nodes-min 2 \
  --nodes-max 5
```

#### Azure AKS
```bash
# AKS 클러스터 생성
az aks create \
  --resource-group markdown-viewer-rg \
  --name markdown-viewer-cluster \
  --node-count 3 \
  --enable-cluster-autoscaler \
  --min-count 2 \
  --max-count 5
```

### 옵션 2: 로컬 개발 환경

#### Minikube
```bash
# Minikube 시작
minikube start --cpus=4 --memory=8192

# Kubernetes 대시보드 활성화
minikube dashboard
```

#### Kind (Kubernetes in Docker)
```bash
# Kind 클러스터 생성
kind create cluster --name markdown-viewer
```

---

## 애플리케이션 배포

### 1. Docker 이미지 빌드 및 푸시

```bash
# 이미지 빌드
docker build -t markdown-viewer:latest .

# 레지스트리에 태그 지정
docker tag markdown-viewer:latest \
  gcr.io/PROJECT_ID/markdown-viewer:latest

# 레지스트리에 푸시
docker push gcr.io/PROJECT_ID/markdown-viewer:latest
```

### 2. 네임스페이스 생성

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: markdown-viewer
```

### 3. ConfigMap 및 Secrets

**configmap.yaml:**
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
  namespace: markdown-viewer
data:
  application.yml: |
    spring:
      redis:
        host: redis-service
        port: 6379
      datasource:
        url: jdbc:postgresql://postgres-service:5432/markdown_viewer
    cache:
      type: redis
      ttl: 3600
```

**secrets.yaml:**
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
  namespace: markdown-viewer
type: Opaque
stringData:
  db.password: "your-secure-password"
  jwt.secret: "your-jwt-secret-key"
  google.client.secret: "your-google-oauth-secret"
```

### 4. Deployment

**deployment.yaml:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: markdown-viewer-api
  namespace: markdown-viewer
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
        image: gcr.io/PROJECT_ID/markdown-viewer:latest
        imagePullPolicy: Always
        ports:
        - containerPort: 8080
          name: http
        env:
        - name: SPRING_PROFILES_ACTIVE
          value: "kubernetes"
        - name: REDIS_HOST
          valueFrom:
            configMapKeyRef:
              name: app-config
              key: redis.host
        envFrom:
        - secretRef:
            name: app-secrets
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /actuator/health/liveness
            port: 8080
          initialDelaySeconds: 60
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /actuator/health/readiness
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 3
```

### 5. Service

**service.yaml:**
```yaml
apiVersion: v1
kind: Service
metadata:
  name: markdown-viewer-api
  namespace: markdown-viewer
spec:
  selector:
    app: markdown-viewer
    component: api
  ports:
  - port: 80
    targetPort: 8080
    protocol: TCP
    name: http
  type: ClusterIP
```

---

## 서비스 메시 및 네트워킹

### Ingress Controller 설치

**Nginx Ingress:**
```bash
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.1/deploy/static/provider/cloud/deploy.yaml
```

### Ingress 설정

**ingress.yaml:**
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: markdown-viewer-ingress
  namespace: markdown-viewer
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/proxy-body-size: "16m"
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

---

## 스토리지 관리

### PersistentVolumeClaim

**pvc.yaml:**
```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: markdown-viewer-data
  namespace: markdown-viewer
spec:
  accessModes:
    - ReadWriteMany  # 여러 Pod에서 동시 접근
  storageClassName: standard
  resources:
    requests:
      storage: 100Gi
```

### StorageClass (GKE 예시)

```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: standard
provisioner: kubernetes.io/gce-pd
parameters:
  type: pd-standard
  replication-type: regional-pd
```

---

## 오토스케일링

### Horizontal Pod Autoscaler

**hpa.yaml:**
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: markdown-viewer-api-hpa
  namespace: markdown-viewer
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
  - type: Pods
    pods:
      metric:
        name: http_requests_per_second
      target:
        type: AverageValue
        averageValue: "100"
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

---

## 모니터링 및 로깅

### Prometheus 설정

**ServiceMonitor:**
```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: markdown-viewer-metrics
  namespace: markdown-viewer
spec:
  selector:
    matchLabels:
      app: markdown-viewer
  endpoints:
  - port: http
    path: /actuator/prometheus
    interval: 30s
```

### 로깅 (Fluentd/Fluent Bit)

**DaemonSet 예시:**
```yaml
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: fluent-bit
  namespace: kube-system
spec:
  # Fluent Bit 설정
  # 로그를 ELK Stack으로 전송
```

---

## 운영 및 트러블슈팅

### 유용한 명령어

```bash
# Pod 상태 확인
kubectl get pods -n markdown-viewer

# 로그 확인
kubectl logs -f deployment/markdown-viewer-api -n markdown-viewer

# Pod 상세 정보
kubectl describe pod <pod-name> -n markdown-viewer

# 리소스 사용량 확인
kubectl top pods -n markdown-viewer

# 이벤트 확인
kubectl get events -n markdown-viewer --sort-by='.lastTimestamp'

# 배포 롤백
kubectl rollout undo deployment/markdown-viewer-api -n markdown-viewer

# 배포 히스토리
kubectl rollout history deployment/markdown-viewer-api -n markdown-viewer
```

### 일반적인 문제 해결

1. **Pod가 시작되지 않을 때**
   - `kubectl describe pod`로 이벤트 확인
   - 이미지 Pull 정책 확인
   - 리소스 제한 확인

2. **서비스 연결 문제**
   - Service의 selector가 Pod label과 일치하는지 확인
   - Endpoints 확인: `kubectl get endpoints`

3. **스토리지 문제**
   - PVC 상태 확인: `kubectl get pvc`
   - StorageClass 확인

---

## 변경 이력

| 버전 | 날짜 | 변경 내용 | 작성자 |
|------|------|----------|--------|
| 1.0 | 2026-01-29 | 초기 작성 | - |
