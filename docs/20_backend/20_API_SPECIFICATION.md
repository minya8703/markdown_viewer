# API 명세서

## 문서 정보
- **프로젝트**: 마크다운 뷰어 V2
- **버전**: 1.0
- **작성일**: 2026-01-29
- **기반 문서**: SYSTEM_ARCHITECTURE.md

## 목차
1. [개요](#개요)
2. [인증](#인증)
3. [인증 API](#인증-api)
4. [사용자 API](#사용자-api)
5. [파일 API](#파일-api)
6. [마크다운 API](#마크다운-api)
7. [에러 처리](#에러-처리)

---

## 개요

### 기본 정보
- **Base URL**: `https://api.example.com/api`
- **인증 방식**: JWT Bearer Token
- **Content-Type**: `application/json`
- **문자 인코딩**: UTF-8

### 공통 헤더
```
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

### 응답 형식
모든 API 응답은 다음 형식을 따릅니다:

**성공 응답:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Success message"
}
```

**에러 응답:**
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error message",
    "details": { ... }
  }
}
```

---

## 인증

### JWT 토큰
- **발급**: Google 로그인 성공 시
- **유효기간**: 24시간
- **갱신**: 리프레시 토큰 사용 (향후 구현)

### 토큰 사용
모든 API 요청에 다음 헤더를 포함해야 합니다:
```
Authorization: Bearer {jwt_token}
```

---

## 인증 API

### POST /api/auth/google/login
Google 로그인 시작

**요청:**
```
GET /api/auth/google/login
```

**응답:**
- **302 Redirect** to Google OAuth URL

**예시:**
```
Location: https://accounts.google.com/o/oauth2/v2/auth?
  client_id=...
  &redirect_uri=...
  &response_type=code
  &scope=openid email profile
  &state={state_token}
```

---

### GET /api/auth/google/callback
Google OAuth 콜백 처리

**요청:**
```
GET /api/auth/google/callback?code={authorization_code}&state={state_token}
```

**응답:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "123",
      "email": "user@example.com",
      "name": "User Name",
      "picture": "https://..."
    }
  }
}
```

**에러:**
- `401 Unauthorized`: 인증 실패
- `400 Bad Request`: 잘못된 요청

---

### POST /api/auth/logout
로그아웃

**요청:**
```
POST /api/auth/logout
Headers:
  Authorization: Bearer {jwt_token}
```

**응답:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### GET /api/auth/me
현재 사용자 정보 조회

**요청:**
```
GET /api/auth/me
Headers:
  Authorization: Bearer {jwt_token}
```

**응답:**
```json
{
  "success": true,
  "data": {
    "id": "123",
    "email": "user@example.com",
    "name": "User Name",
    "picture": "https://...",
    "storageQuota": 1073741824,
    "storageUsed": 52428800,
    "createdAt": "2026-01-01T00:00:00Z"
  }
}
```

---

## 사용자 API

### GET /api/users/me/last-document
마지막 수정 문서 조회

**요청:**
```
GET /api/users/me/last-document
Headers:
  Authorization: Bearer {jwt_token}
```

**응답:**
```json
{
  "success": true,
  "data": {
    "path": "/users/123/files/document.md",
    "name": "document.md",
    "lastModified": "2026-01-29T10:30:00Z"
  }
}
```

**에러:**
- `404 Not Found`: 마지막 문서가 없음

---

## 파일 API

### GET /api/files
파일 목록 조회

**요청:**
```
GET /api/files?path={directory_path}
Headers:
  Authorization: Bearer {jwt_token}
```

**쿼리 파라미터:**
- `path` (optional): 조회할 디렉토리 경로 (기본값: `/users/{userId}/files/`)

**응답:**
```json
{
  "success": true,
  "data": {
    "files": [
      {
        "name": "document1.md",
        "path": "/users/123/files/document1.md",
        "type": "file",
        "size": 1024,
        "lastModified": "2026-01-29T10:30:00Z",
        "encrypted": false
      },
      {
        "name": "folder1",
        "path": "/users/123/files/folder1",
        "type": "directory",
        "lastModified": "2026-01-29T09:00:00Z"
      }
    ]
  }
}
```

---

### GET /api/files/{path}
파일 읽기

**요청:**
```
GET /api/files/{path}
Headers:
  Authorization: Bearer {jwt_token}
```

**경로 파라미터:**
- `path`: 파일 경로 (예: `document.md` 또는 `folder/document.md`)

**응답 (일반 파일):**
```json
{
  "success": true,
  "data": {
    "path": "/users/123/files/document.md",
    "name": "document.md",
    "content": "# Document\n\nContent...",
    "html": "<h1>Document</h1><p>Content...</p>",
    "encrypted": false,
    "lastModified": "2026-01-29T10:30:00Z",
    "size": 1024
  }
}
```

**응답 (암호화된 파일):**
```json
{
  "success": true,
  "data": {
    "path": "/users/123/files/secret.md",
    "name": "secret.md",
    "encrypted": true,
    "encryptedData": "base64_encoded_encrypted_content",
    "iv": "base64_encoded_iv",
    "tag": "base64_encoded_auth_tag",
    "lastModified": "2026-01-29T10:30:00Z",
    "size": 2048
  }
}
```

**에러:**
- `404 Not Found`: 파일을 찾을 수 없음
- `403 Forbidden`: 접근 권한 없음

---

### GET /api/files/{path}/check
파일 변경 감지

**요청:**
```
GET /api/files/{path}/check
Headers:
  Authorization: Bearer {jwt_token}
  If-Modified-Since: {last_modified_timestamp}
```

**경로 파라미터:**
- `path`: 파일 경로

**헤더:**
- `If-Modified-Since` (optional): 마지막 수정 시간

**응답 (변경됨):**
```json
{
  "success": true,
  "data": {
    "modified": true,
    "lastModified": "2026-01-29T11:00:00Z",
    "content": "# Updated Document\n\n...",
    "html": "<h1>Updated Document</h1>..."
  }
}
```

**응답 (변경되지 않음):**
```
304 Not Modified
(Empty body)
```

---

### POST /api/files/{path}
파일 저장

**요청:**
```
POST /api/files/{path}
Headers:
  Authorization: Bearer {jwt_token}
  Content-Type: application/json
Body:
{
  "content": "# Document\n\nContent...",
  "encrypted": false
}
```

**경로 파라미터:**
- `path`: 파일 경로

**요청 본문 (일반 저장):**
```json
{
  "content": "# Document\n\nContent...",
  "encrypted": false
}
```

**요청 본문 (암호화 저장):**
```json
{
  "encrypted": true,
  "encryptedData": "base64_encoded_encrypted_content",
  "iv": "base64_encoded_iv",
  "tag": "base64_encoded_auth_tag"
}
```

**응답:**
```json
{
  "success": true,
  "data": {
    "path": "/users/123/files/document.md",
    "lastModified": "2026-01-29T11:00:00Z",
    "size": 1024
  },
  "message": "File saved successfully"
}
```

**에러:**
- `400 Bad Request`: 잘못된 요청
- `403 Forbidden`: 접근 권한 없음
- `413 Payload Too Large`: 파일 크기 초과

---

### POST /api/files/upload
파일 업로드

**요청:**
```
POST /api/files/upload
Headers:
  Authorization: Bearer {jwt_token}
  Content-Type: multipart/form-data
Body:
  file: {file_data}
  path: {optional_directory_path}
```

**폼 데이터:**
- `file` (required): 업로드할 파일
- `path` (optional): 저장할 디렉토리 경로

**응답:**
```json
{
  "success": true,
  "data": {
    "path": "/users/123/files/uploaded.md",
    "name": "uploaded.md",
    "size": 2048,
    "lastModified": "2026-01-29T11:00:00Z"
  },
  "message": "File uploaded successfully"
}
```

**에러:**
- `400 Bad Request`: 잘못된 파일 형식
- `413 Payload Too Large`: 파일 크기 초과 (16MB)

---

### DELETE /api/files/{path}
파일 삭제

**요청:**
```
DELETE /api/files/{path}?secure={true|false}
Headers:
  Authorization: Bearer {jwt_token}
```

**경로 파라미터:**
- `path`: 파일 경로

**쿼리 파라미터:**
- `secure` (optional): 안전한 삭제 여부 (기본값: false)

**응답:**
```json
{
  "success": true,
  "message": "File deleted successfully"
}
```

**에러:**
- `404 Not Found`: 파일을 찾을 수 없음
- `403 Forbidden`: 접근 권한 없음

---

## 마크다운 API

### POST /api/markdown/render
마크다운 렌더링

**요청:**
```
POST /api/markdown/render
Headers:
  Authorization: Bearer {jwt_token}
  Content-Type: application/json
Body:
{
  "content": "# Document\n\nContent..."
}
```

**요청 본문:**
```json
{
  "content": "# Document\n\nContent..."
}
```

**응답:**
```json
{
  "success": true,
  "data": {
    "html": "<h1>Document</h1><p>Content...</p>"
  }
}
```

---

### POST /api/markdown/detect
마크다운 형식 감지

**요청:**
```
POST /api/markdown/detect
Headers:
  Authorization: Bearer {jwt_token}
  Content-Type: application/json
Body:
{
  "text": "# Header\n\nContent..."
}
```

**요청 본문:**
```json
{
  "text": "# Header\n\nContent..."
}
```

**응답:**
```json
{
  "success": true,
  "data": {
    "isMarkdown": true,
    "confidence": 0.95,
    "detectedElements": [
      "headers",
      "lists",
      "links"
    ]
  }
}
```

---

## 에러 처리

### HTTP 상태 코드

| 코드 | 의미 | 설명 |
|------|------|------|
| 200 | OK | 요청 성공 |
| 201 | Created | 리소스 생성 성공 |
| 304 | Not Modified | 리소스 변경되지 않음 |
| 400 | Bad Request | 잘못된 요청 |
| 401 | Unauthorized | 인증 필요 |
| 403 | Forbidden | 접근 권한 없음 |
| 404 | Not Found | 리소스를 찾을 수 없음 |
| 413 | Payload Too Large | 요청 크기 초과 |
| 500 | Internal Server Error | 서버 오류 |

### 에러 코드

| 코드 | 설명 |
|------|------|
| `AUTH_REQUIRED` | 인증이 필요합니다 |
| `AUTH_INVALID` | 유효하지 않은 토큰 |
| `AUTH_EXPIRED` | 토큰이 만료되었습니다 |
| `FILE_NOT_FOUND` | 파일을 찾을 수 없습니다 |
| `FILE_ACCESS_DENIED` | 파일 접근 권한이 없습니다 |
| `FILE_TOO_LARGE` | 파일 크기가 너무 큽니다 |
| `FILE_INVALID_FORMAT` | 잘못된 파일 형식입니다 |
| `ENCRYPTION_FAILED` | 암호화에 실패했습니다 |
| `DECRYPTION_FAILED` | 복호화에 실패했습니다 |
| `STORAGE_QUOTA_EXCEEDED` | 저장 공간 할당량을 초과했습니다 |
| `INVALID_PATH` | 잘못된 경로입니다 |
| `SERVER_ERROR` | 서버 오류가 발생했습니다 |

### 에러 응답 예시

```json
{
  "success": false,
  "error": {
    "code": "FILE_NOT_FOUND",
    "message": "File not found",
    "details": {
      "path": "/users/123/files/missing.md"
    }
  }
}
```

---

## 인증 예시

### 전체 흐름 예시

```javascript
// 1. Google 로그인 시작
fetch('/api/auth/google/login')
  .then(response => {
    // Google OAuth 페이지로 리다이렉트
    window.location.href = response.url;
  });

// 2. 콜백 후 토큰 저장
const token = response.data.token;
localStorage.setItem('auth_token', token);

// 3. API 요청 시 토큰 사용
fetch('/api/files', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
  .then(response => response.json())
  .then(data => {
    console.log(data);
  });
```

---

## 변경 이력

| 버전 | 날짜 | 변경 내용 | 작성자 |
|------|------|----------|--------|
| 1.0 | 2026-01-29 | 초기 작성 | - |
