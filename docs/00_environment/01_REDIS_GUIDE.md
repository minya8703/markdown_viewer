# Redis 사용 정리

백엔드에서 Redis를 **어디에 쓰는지**, **언제 필요한지**, **설정 방법**을 한곳에 정리한 문서입니다.

---

## 1. Redis를 쓰는 곳 (이 프로젝트)

| 용도 | 설명 | Redis 미사용 시 |
|------|------|-----------------|
| **JWT 블랙리스트** | 로그아웃한 토큰을 만료 시점까지 저장해 재사용 불가 처리 | 인메모리 맵 (`InMemoryJwtBlacklistService`) |
| **파일 메타데이터 캐시** | `FileService.getMetadata()` 결과 캐싱 (목록/조회 반복 시 DB 부하 감소) | 인메모리 캐시 (`ConcurrentMapCacheManager`) |

- **구현**: Redis 연결이 있으면 `RedisJwtBlacklistService` / `RedisCacheManager` 사용, 없으면 위 인메모리 구현으로 자동 전환됩니다.

---

## 2. Redis를 쓰지 않는 곳

| 항목 | 설명 |
|------|------|
| **파일 업로드/저장** | 사용자 파일은 **로컬 디스크**(`FILE_STORAGE_BASE_PATH`)에만 저장합니다. Redis에 파일을 올리지 않습니다. |
| **자동 저장** | 에디터 자동 저장은 **프론트엔드** 상태/저장 API 호출로 처리하며, Redis와 무관합니다. |

정리하면, **파일 내용 저장·업로드에는 Redis가 전혀 관여하지 않습니다.** Redis는 **캐시·블랙리스트** 같은 서버 공유 상태용입니다.

---

## 3. Redis가 꼭 필요한 경우 / 없어도 되는 경우

| 상황 | Redis 필요 여부 |
|------|------------------|
| 단일 인스턴스, 개발/소규모 운영 | **필수 아님** (인메모리로 동작) |
| 멀티 인스턴스(로드밸런서 뒤 2대 이상) | **권장** (로그아웃·캐시를 인스턴스 간 공유하려면 Redis 사용) |
| Kubernetes 등 오토스케일 환경 | **권장** (인스턴스 수가 바뀌어도 블랙리스트·캐시 일관성 유지) |

---

## 4. Redis 사용 시 필요한 설정

### 4.1 환경 변수

| 변수 | 설명 | 기본값 | 비고 |
|------|------|--------|------|
| `REDIS_ENABLED` | Redis 사용 여부 | `false` | Redis 쓸 때만 `true` |
| `REDIS_HOST` | Redis 호스트 | `localhost` | Docker/K8s에서는 서비스명(예: `redis`) |
| `REDIS_PORT` | Redis 포트 | `6379` | |
| `SPRING_AUTOCONFIGURE_EXCLUDE` | Redis 자동구성 제외 | `org.springframework.boot.autoconfigure.data.redis.RedisAutoConfiguration` | Redis **사용** 시 이 값을 **비움**(설정하지 않거나 빈 문자열) |

- **Redis 미사용**이면 위 변수 설정할 필요 없음(기본값으로 인메모리 동작).
- **Redis 사용** 시: `REDIS_ENABLED=true`, `REDIS_HOST`, `REDIS_PORT` 설정하고, `SPRING_AUTOCONFIGURE_EXCLUDE`를 제거하거나 빈 값으로 두어 Redis 자동구성이 로드되게 합니다.

### 4.2 application.yml 요약

- `spring.data.redis.host` / `port`: 환경 변수 `REDIS_HOST`, `REDIS_PORT`로 주입됨.
- `spring.autoconfigure.exclude`: Redis **미사용** 시에만 `RedisAutoConfiguration`을 넣어 두고, **사용** 시에는 이 exclude를 비워야 합니다(환경 변수로 제어 가능).

자세한 값은 `backend/src/main/resources/application.yml` 참고.

---

## 5. 한 줄 요약

- **Redis 용도**: JWT 블랙리스트 + 파일 메타데이터 캐시 (파일 업로드/저장과 무관)
- **Redis 없이**: 단일 인스턴스·개발은 그대로 사용 가능(인메모리로 대체)
- **Redis 쓸 때**: `REDIS_ENABLED=true`, `REDIS_HOST`, `REDIS_PORT` 설정하고 Redis 자동구성 exclude만 제거하면 됨
