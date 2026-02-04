# AdSense 광고 필터(부적절한 광고 차단)

## 요약

**부적절한 광고를 막으려면 앱 코드가 아니라 Google AdSense 게시자 계정에서 설정해야 합니다.**  
광고 선택·차단은 Google이 서버에서 처리하므로, 프론트엔드(Footer 등)에서는 차단 옵션을 줄 수 없습니다.

---

## 1. AdSense 계정에서 할 일

### 1) 민감 카테고리 차단 (Sensitive categories)

부적절·민감한 성격의 광고 카테고리를 한 번에 막을 수 있습니다.

1. [Google AdSense](https://www.google.com/adsense/) 로그인
2. **브랜드 안전(Brand safety)** → 사용 중인 제품(예: 콘텐츠)
3. **차단 설정(Blocking controls)** → **민감 카테고리 관리(Manage Sensitive categories)**
4. 차단할 카테고리 선택 (저장 시 자동 반영)

예: “과도한 선정성”, “과장/선정적 표현” 등이 여기 해당합니다.

- [AdSense 도움말: 민감 카테고리 차단](https://support.google.com/adsense/answer/164131)

### 2) 특정 광고·광고주 차단 (Ad review center)

이미 노출된 광고가 부적절하면, 해당 광고만 차단할 수 있습니다.

1. AdSense **광고 검토(Ad review center)** 메뉴
2. 사이트/광고 단위별로 노출된 광고 목록 확인
3. 부적절한 광고 선택 후 **차단(Block)**

특정 **광고주 URL(도메인)**도 여기서 차단 가능합니다.

- [AdSense: 사이트에 표시되는 광고 허용 및 차단](https://support.google.com/adsense/answer/180609)

### 3) 일반 카테고리 차단

업종별 일반 카테고리(의류, 부동산, 차량 등)도 막을 수 있습니다.

1. **차단 설정(Blocking controls)** → **일반 카테고리(General categories)**
2. 차단할 카테고리 선택 (최대 200개)
3. 저장

- [AdSense: 일반 카테고리 차단](https://support.google.com/adsense/answer/186376)

---

## 2. 이 프로젝트에서 수정하는 것

| 위치 | 역할 |
|------|------|
| **Footer** (`frontend/src/widgets/footer/`) | AdSense 슬롯 표시만 담당. 어떤 광고가 나올지는 Google이 결정 |
| **index.html** | AdSense 스크립트 로드. 차단 로직 없음 |
| **환경 변수** | `VITE_ADSENSE_CLIENT_ID`, 슬롯 ID 등. 계정/슬롯 식별용 |

**코드에서는 “부적절한 광고만 막는” 설정을 할 수 없습니다.**  
차단은 반드시 **AdSense 콘솔 → 브랜드 안전 / 차단 설정 / 광고 검토**에서 해야 합니다.

---

## 3. 참고

- 과도한 카테고리 차단은 경매 경쟁을 줄여 수익에 영향을 줄 수 있습니다. 필요한 수준만 설정하는 것이 좋습니다.
- 민감 카테고리 차단은 지원되는 언어/지역에서만 사용할 수 있습니다.
- 정책·메뉴 이름은 Google 업데이트에 따라 바뀔 수 있으므로, 필요 시 AdSense 도움말에서 “브랜드 안전”, “차단”으로 검색해 최신 절차를 확인하세요.
