# 데이터베이스 설계서

## 문서 정보
- **프로젝트**: 마크다운 뷰어 V2
- **버전**: 1.0
- **작성일**: 2026-01-29
- **기반 문서**: SYSTEM_ARCHITECTURE.md

## 목차
1. [개요](#개요)
2. [데이터베이스 선택](#데이터베이스-선택)
3. [ERD (Entity Relationship Diagram)](#erd)
4. [테이블 설계](#테이블-설계)
5. [인덱스 설계](#인덱스-설계)
6. [마이그레이션 전략](#마이그레이션-전략)

---

## 개요

### 목적
사용자 정보, 파일 메타데이터, 세션 정보 등을 저장하기 위한 데이터베이스 설계입니다.

### 저장 데이터
- 사용자 정보 (Google OAuth 정보)
- 파일 메타데이터 (파일명, 경로, 크기, 수정일 등)
- 사용자 설정 및 선호도
- 마지막 수정 문서 정보

### 저장하지 않는 데이터
- 파일 내용 (파일 시스템에 저장)
- 암호화 키 (사용자만 보관)
- 암호화된 파일 내용 (파일 시스템에 저장)

---

## 데이터베이스 선택

### 최종 추천: PostgreSQL (권장)

**이유:**
- ✅ **MSA 친화적**: Database per Service 패턴에 최적
- ✅ **확장성**: 읽기 복제본, 샤딩 지원
- ✅ **기능 풍부**: JSON 타입, Full-Text Search, 확장 기능
- ✅ **Kubernetes 지원**: StatefulSet 배포 용이
- ✅ **학습 가치**: 실무에서 널리 사용되는 오픈소스 DB
- ✅ **Spring Boot 통합**: Spring Data JPA 완벽 지원

### 단계별 선택

#### 초기 단계: PostgreSQL (개발 환경)
- **이유**: 프로덕션과 동일한 환경으로 개발
- **구성**: Docker Compose로 로컬 구성
- **용도**: 개발 및 테스트

#### 확장 단계: PostgreSQL (프로덕션)
- **이유**: MSA 환경에서 각 서비스별 독립 DB
- **구성**: Kubernetes StatefulSet
- **용도**: 프로덕션 배포 (1000명 이상)

#### 대안: MySQL/MariaDB
- **이유**: 간단한 설정, 빠른 프로토타이핑
- **용도**: 초기 개발 또는 MySQL 경험이 있는 경우

**자세한 내용은 [RDBMS 선택 가이드](./11_RDBMS_RECOMMENDATION.md) 참고**

---

## ERD

```
┌─────────────────┐
│     users       │
├─────────────────┤
│ id (PK)         │
│ google_sub (UK) │
│ email (UK)      │
│ name            │
│ picture_url     │
│ storage_quota   │
│ storage_used    │
│ created_at      │
│ updated_at      │
│ last_login_at   │
└────────┬────────┘
         │
         │ 1:N
         │
         ▼
┌─────────────────┐
│ file_metadata   │
├─────────────────┤
│ id (PK)         │
│ user_id (FK)    │──┐
│ file_path (UK)  │  │
│ file_name       │  │
│ file_size       │  │
│ encrypted       │  │
│ iv              │  │
│ auth_tag        │  │
│ mime_type       │  │
│ last_modified    │  │
│ created_at      │  │
└─────────────────┘  │
                     │
                     │ N:1
                     │
┌─────────────────────┘
│ user_preferences   │
├─────────────────────┤
│ id (PK)            │
│ user_id (FK)       │
│ last_document_path │
│ theme              │
│ font_size          │
│ created_at         │
│ updated_at         │
└─────────────────────┘
```

---

## 테이블 설계

### users 테이블
사용자 정보 저장

```sql
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    google_sub VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    picture_url TEXT,
    storage_quota BIGINT DEFAULT 1073741824, -- 1GB 기본 할당량
    storage_used BIGINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP
);

-- 인덱스
CREATE INDEX idx_users_google_sub ON users(google_sub);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_last_login ON users(last_login_at);
```

**컬럼 설명:**

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | BIGSERIAL | 사용자 고유 ID (PK) |
| google_sub | VARCHAR(255) | Google 고유 사용자 ID (UK) |
| email | VARCHAR(255) | 이메일 주소 (UK) |
| name | VARCHAR(255) | 사용자 이름 |
| picture_url | TEXT | 프로필 사진 URL |
| storage_quota | BIGINT | 저장 공간 할당량 (bytes) |
| storage_used | BIGINT | 사용 중인 저장 공간 (bytes) |
| created_at | TIMESTAMP | 계정 생성 시간 |
| updated_at | TIMESTAMP | 정보 수정 시간 |
| last_login_at | TIMESTAMP | 마지막 로그인 시간 |

---

### file_metadata 테이블
파일 메타데이터 저장

```sql
CREATE TABLE file_metadata (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    file_path VARCHAR(1024) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size BIGINT,
    encrypted BOOLEAN DEFAULT FALSE,
    iv VARCHAR(255), -- Base64 encoded IV
    auth_tag VARCHAR(255), -- Base64 encoded auth tag
    mime_type VARCHAR(100) DEFAULT 'text/markdown',
    last_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, file_path)
);

-- 인덱스
CREATE INDEX idx_file_metadata_user_id ON file_metadata(user_id);
CREATE INDEX idx_file_metadata_path ON file_metadata(file_path);
CREATE INDEX idx_file_metadata_last_modified ON file_metadata(user_id, last_modified DESC);
CREATE INDEX idx_file_metadata_encrypted ON file_metadata(user_id, encrypted);
```

**컬럼 설명:**

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | BIGSERIAL | 메타데이터 고유 ID (PK) |
| user_id | BIGINT | 사용자 ID (FK) |
| file_path | VARCHAR(1024) | 파일 경로 (user_id와 함께 UK) |
| file_name | VARCHAR(255) | 파일명 |
| file_size | BIGINT | 파일 크기 (bytes) |
| encrypted | BOOLEAN | 암호화 여부 |
| iv | VARCHAR(255) | 초기화 벡터 (암호화된 파일만) |
| auth_tag | VARCHAR(255) | 인증 태그 (암호화된 파일만) |
| mime_type | VARCHAR(100) | MIME 타입 |
| last_modified | TIMESTAMP | 마지막 수정 시간 |
| created_at | TIMESTAMP | 파일 생성 시간 |

---

### user_preferences 테이블
사용자 설정 및 선호도 저장

```sql
CREATE TABLE user_preferences (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    last_document_path VARCHAR(1024),
    theme VARCHAR(50) DEFAULT 'light',
    font_size INTEGER DEFAULT 16,
    auto_save_interval INTEGER DEFAULT 180, -- 초 단위 (3분)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스
CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);
```

**컬럼 설명:**

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | BIGSERIAL | 설정 고유 ID (PK) |
| user_id | BIGINT | 사용자 ID (FK, UK) |
| last_document_path | VARCHAR(1024) | 마지막 수정 문서 경로 |
| theme | VARCHAR(50) | 테마 (light/dark) |
| font_size | INTEGER | 글자 크기 |
| auto_save_interval | INTEGER | 자동 저장 간격 (초) |
| created_at | TIMESTAMP | 설정 생성 시간 |
| updated_at | TIMESTAMP | 설정 수정 시간 |

---

## 인덱스 설계

### 주요 인덱스

#### 1. 사용자 조회 인덱스
```sql
-- Google sub로 사용자 조회
CREATE INDEX idx_users_google_sub ON users(google_sub);

-- 이메일로 사용자 조회
CREATE INDEX idx_users_email ON users(email);
```

#### 2. 파일 메타데이터 조회 인덱스
```sql
-- 사용자별 파일 목록 조회
CREATE INDEX idx_file_metadata_user_id ON file_metadata(user_id);

-- 마지막 수정 문서 조회
CREATE INDEX idx_file_metadata_last_modified 
ON file_metadata(user_id, last_modified DESC);

-- 암호화된 파일 조회
CREATE INDEX idx_file_metadata_encrypted 
ON file_metadata(user_id, encrypted);
```

#### 3. 복합 인덱스
```sql
-- 사용자별 경로 조회 (UNIQUE 제약으로 자동 생성)
-- (user_id, file_path) - 이미 UNIQUE 제약으로 인덱스 생성됨
```

---

## 마이그레이션 전략

### 초기 마이그레이션 (SQLite → PostgreSQL)

#### 1. 데이터베이스 생성
```sql
-- PostgreSQL 데이터베이스 생성
CREATE DATABASE markdown_viewer;

-- 사용자 생성
CREATE USER markdown_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE markdown_viewer TO markdown_user;
```

#### 2. 테이블 생성
```sql
-- 위의 CREATE TABLE 문 실행
-- users 테이블
-- file_metadata 테이블
-- user_preferences 테이블
```

#### 3. 데이터 마이그레이션
```bash
# SQLite에서 데이터 추출
sqlite3 markdown_viewer.db .dump > dump.sql

# PostgreSQL로 데이터 임포트 (수정 필요)
psql -U markdown_user -d markdown_viewer < dump.sql
```

---

## 데이터 무결성

### 외래 키 제약
- `file_metadata.user_id` → `users.id` (CASCADE DELETE)
- `user_preferences.user_id` → `users.id` (CASCADE DELETE)

### 유니크 제약
- `users.google_sub` (UNIQUE)
- `users.email` (UNIQUE)
- `(file_metadata.user_id, file_metadata.file_path)` (UNIQUE)

### 체크 제약
```sql
-- 저장 공간 할당량 검증
ALTER TABLE users 
ADD CONSTRAINT chk_storage_quota 
CHECK (storage_quota > 0);

-- 사용 공간 검증
ALTER TABLE users 
ADD CONSTRAINT chk_storage_used 
CHECK (storage_used >= 0);

-- 파일 크기 검증
ALTER TABLE file_metadata 
ADD CONSTRAINT chk_file_size 
CHECK (file_size >= 0);
```

---

## 성능 최적화

### 쿼리 최적화

#### 1. 마지막 수정 문서 조회
```sql
-- 인덱스 활용
SELECT file_path, last_modified
FROM file_metadata
WHERE user_id = ?
ORDER BY last_modified DESC
LIMIT 1;
-- idx_file_metadata_last_modified 인덱스 사용
```

#### 2. 사용자별 파일 목록 조회
```sql
-- 인덱스 활용
SELECT *
FROM file_metadata
WHERE user_id = ?
ORDER BY file_name;
-- idx_file_metadata_user_id 인덱스 사용
```

#### 3. 저장 공간 사용량 조회
```sql
-- 집계 쿼리 최적화
SELECT 
    user_id,
    SUM(file_size) as total_size
FROM file_metadata
WHERE user_id = ?
GROUP BY user_id;
-- idx_file_metadata_user_id 인덱스 사용
```

---

## 백업 및 복구

### 백업 전략
```sql
-- 전체 데이터베이스 백업
pg_dump -U markdown_user -d markdown_viewer > backup.sql

-- 특정 테이블만 백업
pg_dump -U markdown_user -d markdown_viewer -t users > users_backup.sql
```

### 복구 전략
```sql
-- 전체 데이터베이스 복구
psql -U markdown_user -d markdown_viewer < backup.sql

-- 특정 테이블 복구
psql -U markdown_user -d markdown_viewer < users_backup.sql
```

---

## 보안 고려사항

### 데이터 암호화
- **전송 중**: HTTPS (TLS 1.2+)
- **저장 중**: 
  - 파일 내용: 클라이언트 사이드 암호화 (AES-256-GCM)
  - 데이터베이스: PostgreSQL 암호화 (선택적)

### 접근 제어
- 데이터베이스 사용자 권한 분리
- 애플리케이션 계정과 관리자 계정 분리
- 최소 권한 원칙 적용

### 데이터 보호
- 개인정보 암호화 저장 (필요시)
- 정기적인 백업
- 안전한 백업 저장소

---

## 모니터링

### 주요 지표
- 테이블 크기 모니터링
- 쿼리 성능 모니터링
- 인덱스 사용률 모니터링
- 연결 수 모니터링

### 쿼리 예시
```sql
-- 테이블 크기 조회
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- 인덱스 사용률 조회
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```

---

## 변경 이력

| 버전 | 날짜 | 변경 내용 | 작성자 |
|------|------|----------|--------|
| 1.0 | 2026-01-29 | 초기 작성 | - |
