<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# minds — 치매 예방 앱 (어머니/장모님용)

## 프로젝트 개요

**대상 사용자**: 본인의 어머니 + 장모님 (60대 후반~70대)
**목적**: 매일 사용하는 치매 예방 앱. 인지 게임으로 두뇌 자극 + 일상 기록 + 가족과 소통.

## 핵심 기능

1. **인지 게임/퀴즈** — 단어 맞추기, 그림 기억, 간단 계산 등. 풀면 포인트 적립
2. **포인트 환전** — 어머니가 모은 포인트를 자식이 실제 돈으로 환전 (송금은 앱 외부)
3. **양방향 가족 피드**
   - 어머니가 일상/식사 사진 업로드 → 자식이 매직링크로 확인
   - 자식이 사진/메시지 전송 → 어머니 메인 화면에 표시
4. **운동 등록 & 기록** — 정기 운동 (아쿠아워킹, 헬스 등) 일정 관리 + 단발 기록
5. **약 & 일정 알림** — 약 먹을 시간, 병원 갈 날짜 등 푸시 알림
6. **건강 체크인** — 수면/식욕/통증/기분 1-5점 척도, 메모

## 사용자 모델

- **어머니**: 정식 Supabase Auth 계정 (이메일+비밀번호 또는 OAuth). 주 사용자.
- **자식·가족**: `FamilyMember` 레코드로 등록. 별도 로그인 없이 매직링크(`accessToken`)로 어머니 계정 일부 기능 접근.
  - 가능: 사진/메시지 보내기, 환전 요청 승인
  - 불가: 어머니의 게임 점수 직접 수정, 어머니 본인 정보 수정

## 노년 친화 UX 원칙

- **큰 글씨**: 기본 폰트 스케일 1.2배 (`User.fontScale`), 사용자가 조정 가능
- **고대비 옵션**: `User.highContrast` 토글
- **한 화면 한 기능**: 페이지당 액션 1~2개로 제한
- **명확한 라벨**: 아이콘만 쓰지 말 것. 항상 한글 텍스트 동반
- **큰 터치 영역**: 최소 56px (Material 권장 48px보다 큼)
- **단순한 색**: 노란/하양 위주 + 강조 1색
- **에러 메시지**: 기술 용어 금지. "다시 해주세요" 같은 평범한 말로

## 기술 스택 (OnYou와 동일 패턴)

- **프레임워크**: Next.js 16 (App Router, no src/, Tailwind v4)
- **DB**: PostgreSQL on Supabase + Prisma 6.x
- **인증**: Supabase Auth (`@supabase/ssr`)
- **푸시**: Web Push (VAPID)
- **AI** (선택): Anthropic Claude (`@anthropic-ai/sdk`)
- **배포**: Vercel

## 디렉토리 구조 (목표)

```
app/
  (app)/              # 어머니용 메인 — 로그인 필요
    page.tsx          # 홈 (오늘의 게임/일정/포인트)
    games/            # 인지 게임 모음
    photos/           # 일상/식사 사진 업로드
    workout/          # 운동 등록/기록
    medications/      # 약 관리
    reminders/        # 일정 알림
    family/           # 가족이 보낸 메시지/사진
    points/           # 포인트 잔액 & 환전 신청
  (auth)/             # 로그인/회원가입
  family/             # 자식용 — 매직링크 접근
    [token]/          # accessToken 기반 라우팅
      page.tsx        # 자식 대시보드
      send/           # 사진/메시지 보내기
      payouts/        # 환전 승인
  api/
    cron/             # 일정/약 알림
    push/             # 푸시 구독
lib/
  prisma.ts
  supabase/
  ai/                 # 인지 게임 문제 생성 등 (선택)
prisma/
  schema.prisma
```

## Prisma 작업 워크플로우

회사망에서는 SSL 가로채기 때문에 Prisma 엔진 다운로드가 실패함 (`binaries.prisma.sh`). 집 네트워크나 모바일 핫스팟에서만 실행:

```powershell
npx prisma generate    # client 생성
npx prisma db push     # 마이그레이션 파일 없이 스키마 적용 (초기)
npx prisma migrate dev --name <name>   # 정식 마이그레이션 (나중에)
```

## 코드 컨벤션 (OnYou에서 가져옴)

- Server Actions 위주. 라우트 핸들러는 cron/push 같은 외부 API용으로만.
- 컴포넌트는 `components/` 또는 라우트 옆 `_components/`.
- 데이터 fetch 함수는 `lib/data/`에.
- Tailwind 유틸리티 직접 사용. `cn()` helper로 conditional class.
- 폼 검증은 zod schema → server action 안에서 parse.
