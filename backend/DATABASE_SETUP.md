# 데이터베이스 설정 가이드

## 문제 해결

현재 오류: `Access denied for user 'root'@'localhost'`

이 오류는 MariaDB 연결 인증 실패를 의미합니다.

## 해결 방법

### 1. MariaDB 실행 확인

MariaDB가 실행 중인지 확인하세요.

**Windows 서비스 확인:**
```powershell
Get-Service -Name "*mariadb*"
```

또는
```powershell
Get-Service -Name "*mysql*"
```

### 2. 데이터베이스 및 사용자 설정

#### 방법 1: 기존 root 계정 사용

MariaDB에 접속하여 비밀번호 확인:

```sql
-- MariaDB 접속 (비밀번호 입력)
mysql -u root -p

-- 데이터베이스 생성
CREATE DATABASE IF NOT EXISTS markdown_viewer CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 사용자 확인
SELECT user, host FROM mysql.user WHERE user='root';
```

#### 방법 2: 환경 변수로 데이터베이스 정보 설정

PowerShell에서:
```powershell
$env:DB_USERNAME="root"
$env:DB_PASSWORD="실제-비밀번호"
```

#### 방법 3: application.yml 직접 수정

`backend/src/main/resources/application.yml` 파일에서:

```yaml
spring:
  datasource:
    username: root
    password: 실제-비밀번호
```

### 3. 데이터베이스가 없는 경우

MariaDB에 접속하여:

```sql
CREATE DATABASE markdown_viewer CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 4. 비밀번호를 모르는 경우

#### MariaDB 비밀번호 재설정:

1. MariaDB 서비스 중지
2. `--skip-grant-tables` 옵션으로 시작
3. 비밀번호 재설정
4. 서비스 재시작

또는 새 사용자 생성:

```sql
CREATE USER 'markdown_user'@'localhost' IDENTIFIED BY '새비밀번호';
GRANT ALL PRIVILEGES ON markdown_viewer.* TO 'markdown_user'@'localhost';
FLUSH PRIVILEGES;
```

그리고 `application.yml` 수정:
```yaml
spring:
  datasource:
    username: markdown_user
    password: 새비밀번호
```

## 빠른 확인 방법

1. **MariaDB 접속 테스트:**
```powershell
mysql -u root -p
```

2. **데이터베이스 확인:**
```sql
SHOW DATABASES;
```

3. **사용자 확인:**
```sql
SELECT user, host FROM mysql.user;
```

## 환경 변수 설정 (권장)

PowerShell에서:
```powershell
# 반드시 따옴표 사용 (PowerShell에서는 필수)
$env:DB_USERNAME="root"
$env:DB_PASSWORD="실제-MariaDB-비밀번호"
```

**중요**: PowerShell에서는 환경 변수 값에 **반드시 따옴표를 사용**해야 합니다. 따옴표 없이 입력하면 PowerShell이 값을 명령어로 해석하여 오류가 발생합니다.

그리고 백엔드 재실행:
```powershell
cd c:\tmp\markdown_viewer_v2\backend
.\gradlew.bat bootRun
```
