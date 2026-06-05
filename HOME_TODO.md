# 🏠 minds — 집에서 이어서 할 작업

> 이 파일은 임시 메모입니다. 다 끝나면 삭제하고 커밋하세요.

## 회사에서 끝낸 것

- Next.js 16 스캐폴딩 (`create-next-app`, TypeScript + Tailwind + ESLint + App Router)
- 의존성 설치: Prisma, Supabase, zod, date-fns, clsx, tailwind-merge, lucide-react, radix-slot, web-push
- [prisma/schema.prisma](prisma/schema.prisma) 작성 — 모든 모델 정의 (User, FamilyMember, GamePlay, PointTransaction, PointPayoutRequest, Photo, FamilyPost, Workout, Medication, Reminder, HealthCheckIn 등)
- 공통 lib 파일: [lib/prisma.ts](lib/prisma.ts), [lib/utils.ts](lib/utils.ts), [lib/supabase/client.ts](lib/supabase/client.ts), [lib/supabase/server.ts](lib/supabase/server.ts)
- [AGENTS.md](AGENTS.md) — 프로젝트 컨텍스트
- package.json에 `postinstall: prisma generate`, `build: prisma generate && next build` 추가
- GitHub `hyungjin1994/mindsRepo` 연결 + 첫 push 완료

## 집에서 1순위 — 인프라

### 1. Supabase 프로젝트 생성
1. https://supabase.com/dashboard → **New project**
2. 이름: `minds`
3. Region: `Northeast Asia (Seoul)` (OnYou와 같이)
4. DB 비밀번호 메모해두기

### 2. Vercel 프로젝트 생성
1. https://vercel.com/new → `hyungjin1994/mindsRepo` import
2. Framework: Next.js (자동 감지)
3. Project name: `minds`
4. **Environment Variables** 등록 (OnYou 했던 방식 그대로):
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `DATABASE_URL` (transaction pooler), `DIRECT_URL` (direct connection)
   - `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_SUBJECT`
   - `CRON_SECRET`
   - `ANTHROPIC_API_KEY` — 인지 게임 문제 자동 생성 등에 쓸 거라 이번엔 등록하는 게 좋음 (선택)

### 3. 로컬 .env 만들기
```powershell
cd C:\minds
vercel link    # hyungjin1994's projects / minds 선택
vercel env pull .env
```
(또는 OnYou에서 했던 것처럼 손으로 채워도 됨)

### 4. DB 마이그레이션
```powershell
npx prisma db push
```
회사망에서 안 되던 게 집에서는 됩니다.

### 5. Supabase Auth 설정
- **URL Configuration** → Site URL 에 Vercel production URL 등록
- **Storage** → 사진 업로드 버킷 만들기:
  - 버킷명: `photos` (어머니 일상/식사 사진)
  - 버킷명: `family-posts` (자식이 보낸 사진)
  - 둘 다 private, 인증된 사용자만 업로드 가능 (RLS 정책 필요)

## 집에서 2순위 — 기능 구현 (다음 작업 세션)

### A. 인증 흐름 (어머니용)
- [ ] 회원가입/로그인 페이지 (`app/(auth)/`)
- [ ] 노년 친화 — 큰 입력 필드, 이메일 인증 대신 OAuth 우선 (네이버/카카오 고려)
- [ ] 미들웨어로 미로그인 시 `/login` 리다이렉트

### B. 메인 홈 (`app/(app)/page.tsx`)
- [ ] 오늘의 게임 1개 (눈에 띄게)
- [ ] 모은 포인트 + 환전 신청 버튼
- [ ] 약 알림 (다음 약 시간)
- [ ] 가족이 보낸 새 메시지/사진 (있으면)

### C. 인지 게임 (`app/(app)/games/`)
- [ ] 게임 5종 중 우선 1~2개부터:
  - 단어 맞추기 (가장 만들기 쉬움)
  - 그림 기억 (이미지 자산 필요)
- [ ] 게임 종료 시 점수 → GamePlay 저장 → PointTransaction 생성
- [ ] AI로 문제 자동 생성하면 콘텐츠 무한 (Anthropic 연동)

### D. 사진 업로드 (`app/(app)/photos/`)
- [ ] 폰 카메라 바로 호출 (`<input type="file" accept="image/*" capture="environment">`)
- [ ] 종류 선택: 일상 / 식사
- [ ] Supabase Storage에 업로드 후 Photo 레코드 생성
- [ ] 포인트 적립 (식사 사진은 일상보다 +1 정도)

### E. 운동 등록 (`app/(app)/workout/`)
- [ ] 정기 운동 등록 UI (요일·시간 선택) — 아쿠아워킹/헬스 프리셋 큰 버튼
- [ ] 오늘 운동 했어요 버튼 (단발 기록 + 포인트)
- [ ] 운동 후기 한 줄 메모 가능

### F. 가족 피드 (양방향)
- [ ] 어머니 화면 — 받은 메시지 리스트 (`app/(app)/family/`)
- [ ] 자식용 매직링크 페이지 (`app/family/[token]/`) — 어머니 사진 보기 + 보내기
- [ ] 환전 요청 알림 + 승인/거절

### G. 약 & 일정 알림
- [ ] 약 등록 + 매일 약 먹은 체크 UI
- [ ] 푸시 알림 cron — OnYou의 `app/api/cron/check-routines` 참고
- [ ] **Hobby 플랜이라 cron은 하루 1회 제한** — 약 알림이 매시간 필요하면 Pro 업그레이드 검토 필요

### H. 포인트 환전
- [ ] 어머니: 환전 신청 폼 (포인트 → 원화 환산 표시, 메모 입력)
- [ ] 자식 매직링크에서 알림 받고 승인
- [ ] 자식이 외부 송금 후 "완료" 버튼

## 컨텍스트

- OnYou (`c:\OnYou\onyouRepo`)와 같은 계정, 같은 스택. 코드 패턴 그대로 가져오면 됨.
- 두 어머니 = 별도 계정 (서로 독립). 자식(본인 + 와이프) = 어머니마다 FamilyMember 등록.
- 회사망 SSL 가로채기 이슈는 집에서는 무관.

## 마무리

전체 인프라 + 기능 1차 구현 끝나면:
```powershell
del HOME_TODO.md
git add HOME_TODO.md
git commit -m "chore: remove home todo"
git push
```
