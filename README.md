# Instagram Scraper - Pepsi Korea

Instagram 게시글 데이터를 수집하는 스크래퍼입니다. Playwright를 사용하여 경쟁사 SNS 분석을 위한 데이터를 수집합니다.

## 주요 기능

다음 데이터를 수집합니다:
- 📷 **사진/비디오** - 게시글의 모든 미디어 URL
- 📝 **캡션** - 게시글 설명/내용
- #️⃣ **해시태그** - 캡션에서 추출한 모든 해시태그
- 📅 **작성일자** - 게시글 작성 시간
- ❤️ **좋아요 수** - 좋아요 개수
- 💬 **댓글 수** - 댓글 개수
- 📍 **위치 정보** - 태그된 위치 (있는 경우)
- 🔗 **게시글 URL** - 게시글 직접 링크

## 설치 방법

### 1. 의존성 설치

```bash
npm install
```

### 2. Playwright 브라우저 설치

```bash
npm run install-browser
```

### 3. 환경 변수 설정 (선택사항)

`.env` 파일을 생성하고 다음 내용을 추가합니다:

```bash
cp .env.example .env
```

`.env` 파일 내용:
```env
# Instagram 로그인 정보 (선택사항, 로그인하면 더 많은 데이터에 접근 가능)
INSTAGRAM_USERNAME=your_username
INSTAGRAM_PASSWORD=your_password

# 수집할 계정
TARGET_ACCOUNT=pepsi.korea

# 수집 옵션
MAX_POSTS=50
HEADLESS=true
SCREENSHOT=false
```

## 사용 방법

### 기본 실행 (pepsi.korea 계정, 50개 게시글)

```bash
npm start
```

### 특정 계정 스크래핑

```bash
npm start -- --account pepsi.korea --max 30
```

### 브라우저 화면 보면서 실행 (디버깅용)

```bash
npm start -- --headless false
```

### 스크린샷과 함께 실행

```bash
npm start -- --screenshot
```

### 로그인과 함께 실행

```bash
npm start -- --username your_username --password your_password
```

### 모든 옵션 사용 예시

```bash
npm start -- --account cocacola --max 100 --headless false --screenshot
```

## 명령어 옵션

| 옵션 | 설명 | 기본값 |
|------|------|--------|
| `--account <username>` | 스크래핑할 Instagram 계정 | `pepsi.korea` |
| `--max <number>` | 수집할 최대 게시글 수 | `50` |
| `--username <username>` | Instagram 로그인 아이디 | - |
| `--password <password>` | Instagram 로그인 비밀번호 | - |
| `--headless <true\|false>` | 헤드리스 모드 실행 | `true` |
| `--screenshot` | 스크린샷 촬영 | `false` |
| `--help` | 도움말 표시 | - |

## 출력 데이터

수집된 데이터는 `data/` 폴더에 JSON 형식으로 저장됩니다:

- `data/instagram_[계정]_[타임스탬프].json` - 타임스탬프가 포함된 파일
- `data/latest.json` - 가장 최근 수집 데이터 (항상 덮어씌워짐)

### 데이터 형식 예시

```json
{
  "account": "pepsi.korea",
  "scrapedAt": "2026-02-16T03:30:00.000Z",
  "totalPosts": 50,
  "posts": [
    {
      "url": "https://www.instagram.com/p/ABC123/",
      "postId": "ABC123",
      "media": [
        {
          "type": "image",
          "url": "https://..."
        }
      ],
      "caption": "펩시 신제품 출시! #펩시 #신제품",
      "hashtags": ["#펩시", "#신제품"],
      "likes": "1,234",
      "commentsCount": "56",
      "timestamp": "2026-02-15T10:00:00.000Z",
      "date": "February 15, 2026",
      "location": "Seoul, Korea"
    }
  ]
}
```

## 기술 스택

- **Playwright** - 브라우저 자동화
- **Stealth Mode** - 봇 감지 우회 기능
- **Node.js** - JavaScript 런타임

## 주의사항

⚠️ **중요 안내**

1. **사용 제한**: Instagram의 이용 약관을 준수해야 합니다. 과도한 스크래핑은 계정 차단으로 이어질 수 있습니다.

2. **Rate Limiting**: 각 게시글 사이에 랜덤 지연(1-3초)을 두어 자연스러운 사용 패턴을 모방합니다.

3. **로그인**: 로그인 없이도 공개 게시글을 수집할 수 있지만, 로그인하면 더 안정적으로 데이터를 수집할 수 있습니다.

4. **비공개 계정**: 비공개 계정은 팔로우 승인 후에만 데이터를 수집할 수 있습니다.

5. **법적 책임**: 수집한 데이터의 사용은 사용자의 책임입니다. 저작권 및 개인정보 보호법을 준수하세요.

## 문제 해결

### Playwright 설치 오류

```bash
# Chromium 브라우저 재설치
npx playwright install chromium --force
```

### 로그인 실패

- Instagram이 보안 인증을 요구할 수 있습니다
- 2FA가 활성화된 경우 앱 비밀번호를 사용하세요
- 로그인 없이 실행하려면 credentials를 제거하세요

### 스크래핑 중 차단됨

- `--headless false`로 실행하여 무엇이 문제인지 확인
- MAX_POSTS 수를 줄이세요
- 더 긴 지연 시간을 설정하세요

## 라이선스

MIT License

## 면책 조항

이 도구는 교육 및 연구 목적으로만 제공됩니다. Instagram의 서비스 약관을 위반하지 않도록 주의하세요.
