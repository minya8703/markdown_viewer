# 프론트엔드 문제 해결 가이드

## 화면이 아예 안 나오는 경우

### 1. 개발 서버가 실행되지 않음

**증상**: 브라우저에서 `localhost:3000` 접속 시 연결할 수 없음

**확인 방법:**
```powershell
# 프론트엔드 디렉토리에서
cd c:\tmp\markdown_viewer_v2\frontend
npm run dev
```

**예상 출력:**
```
  VITE v5.0.0  ready in 500 ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
```

**해결:**
- 서버가 실행되지 않았다면 `npm run dev` 실행
- 포트 3000이 이미 사용 중이면 다른 포트로 자동 변경됨 (콘솔 메시지 확인)

---

### 2. 포트 충돌

**증상**: `Port 3000 is in use, trying another one...` 메시지

**확인 방법:**
```powershell
# 포트 3000 사용 중인 프로세스 확인
netstat -ano | findstr :3000
```

**해결:**
- 다른 프로세스 종료 또는
- Vite가 자동으로 다른 포트(예: 3001)로 변경하므로 새 URL 사용

---

### 3. 빌드/컴파일 오류

**증상**: 브라우저 콘솔에 오류 메시지, 빈 화면

**확인 방법:**
1. **터미널 확인**: `npm run dev` 실행 시 오류 메시지 확인
2. **브라우저 콘솔 확인**: F12 → Console 탭

**일반적인 오류:**
- `Cannot find module '@shared/...'` → 경로 별칭 문제
- `Uncaught SyntaxError` → TypeScript 컴파일 오류
- `Failed to load resource` → 파일 경로 문제

**해결:**
```powershell
# 의존성 재설치
npm install

# 타입 체크
npm run type-check

# 린트 확인
npm run lint
```

---

### 4. 브라우저 캐시 문제

**증상**: 코드를 수정했는데 변경사항이 반영되지 않음

**해결:**
- **하드 리프레시**: `Ctrl + Shift + R` (Windows) 또는 `Cmd + Shift + R` (Mac)
- **캐시 비우기**: F12 → Network 탭 → "Disable cache" 체크
- **시크릿 모드**: 새 시크릿 창에서 테스트

---

### 5. JavaScript 실행 오류

**증상**: 빈 화면, 브라우저 콘솔에 오류

**확인 방법:**
브라우저 콘솔(F12)에서 확인:

```javascript
// 1. DOM 요소 확인
console.log(document.getElementById('app')); // null이면 문제

// 2. 스크립트 로드 확인
// Network 탭에서 index.ts 파일이 200 OK로 로드되는지 확인

// 3. 초기화 오류 확인
// Console 탭에서 빨간색 오류 메시지 확인
```

**일반적인 오류:**
- `App element not found` → `index.html`의 `<div id="app"></div>` 확인
- `Cannot read property 'appendChild'` → DOM이 로드되기 전 실행
- `Module not found` → import 경로 오류

---

### 6. 라우팅 문제

**증상**: 특정 경로에서만 빈 화면

**확인 방법:**
```javascript
// 브라우저 콘솔에서
console.log(window.location.pathname); // 현재 경로 확인
```

**해결:**
- 루트 경로(`/`) 접속 시 자동으로 `/login` 또는 `/viewer`로 리다이렉트됨
- 직접 `/login` 또는 `/viewer` 접속 시도

---

### 7. 네트워크/프록시 문제

**증상**: API 요청 실패, 일부 리소스 로드 실패

**확인 방법:**
브라우저 Network 탭(F12)에서:
- CDN 리소스(Font Awesome, Highlight.js) 로드 실패 여부
- `/api/*` 요청이 프록시를 통해 전달되는지 확인

**해결:**
- 인터넷 연결 확인
- 방화벽/프록시 설정 확인
- Vite 프록시 설정 확인 (`vite.config.ts`)

---

### 8. TypeScript 컴파일 오류

**증상**: 개발 서버는 실행되지만 화면이 안 나옴

**확인 방법:**
```powershell
npm run type-check
```

**해결:**
- 타입 오류 수정
- `tsconfig.json` 설정 확인

---

## 단계별 진단 체크리스트

### Step 1: 개발 서버 실행 확인
```powershell
cd c:\tmp\markdown_viewer_v2\frontend
npm run dev
```
✅ 터미널에 "ready" 메시지가 나타나는가?
✅ `http://localhost:3000` URL이 표시되는가?

### Step 2: 브라우저 접속 확인
✅ `http://localhost:3000` 접속 시 페이지가 로드되는가?
✅ 빈 화면인가, 아니면 연결 오류인가?

### Step 3: 브라우저 콘솔 확인 (F12)
✅ Console 탭에 오류 메시지가 있는가?
✅ Network 탭에서 `index.ts` 파일이 로드되는가?
✅ `index.html`이 로드되는가?

### Step 4: DOM 확인
브라우저 콘솔에서:
```javascript
document.getElementById('app') // null이 아니어야 함
```

### Step 5: 초기화 확인
브라우저 콘솔에서:
```javascript
// App이 초기화되었는지 확인
window.location.pathname // 현재 경로 확인
```

---

## 빠른 해결 방법

### 방법 1: 완전 재시작
```powershell
# 1. 개발 서버 중지 (Ctrl+C)
# 2. node_modules 삭제
rm -r node_modules  # 또는 Windows: rmdir /s node_modules
# 3. 재설치
npm install
# 4. 재시작
npm run dev
```

### 방법 2: 포트 변경
`vite.config.ts`에서:
```typescript
server: {
  port: 3001, // 3000 대신 다른 포트 사용
}
```

### 방법 3: 호스트 바인딩
`vite.config.ts`에서:
```typescript
server: {
  host: '0.0.0.0', // 모든 네트워크 인터페이스에 바인딩
  port: 3000,
}
```

---

## 일반적인 오류 메시지와 해결

### "Cannot GET /"
**원인**: Vite 개발 서버가 실행되지 않음
**해결**: `npm run dev` 실행

### "App element not found"
**원인**: `index.html`의 `<div id="app"></div>` 누락
**해결**: `index.html` 확인

### "Module not found"
**원인**: import 경로 오류 또는 파일 누락
**해결**: 파일 경로 확인, `tsconfig.json`의 path alias 확인

### "Port 3000 is already in use"
**원인**: 다른 프로세스가 포트 3000 사용 중
**해결**: 다른 프로세스 종료 또는 포트 변경

---

## 추가 디버깅 팁

### 1. Vite 상세 로그
```powershell
npm run dev -- --debug
```

### 2. 브라우저 소스맵 확인
- F12 → Sources 탭
- 원본 TypeScript 파일 확인 가능

### 3. 네트워크 요청 확인
- F12 → Network 탭
- 각 리소스의 상태 코드 확인 (200 OK여야 함)

### 4. 콘솔 로그 추가
`src/app/index.ts`에:
```typescript
console.log('App initializing...');
console.log('App element:', appElement);
```

---

## 예방 방법

1. **정기적인 의존성 업데이트 확인**
2. **타입 체크 실행**: `npm run type-check`
3. **린트 실행**: `npm run lint`
4. **브라우저 캐시 정리**: 개발 중에는 캐시 비활성화
5. **포트 충돌 확인**: 다른 프로젝트와 포트 충돌 방지
