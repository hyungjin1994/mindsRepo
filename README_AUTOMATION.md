# 운영 / 자동화 메모

로컬 셋업과 배포 자동화에 필요한 내용을 정리한 문서입니다.

## 1) 환경변수 (.env.local)

`.env.example` 를 `.env.local` 로 복사한 뒤 값을 채우세요. (`.env.local` 은 git 에 커밋되지 않습니다.)

- **DATABASE_URL / DIRECT_URL** — PostgreSQL 연결. Supabase 프로젝트의 connection string 사용.
- **NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY** — Supabase Auth & Storage.
- **NEXT_PUBLIC_APP_URL** — 매직링크 등에서 쓰는 앱 주소.
- **SMTP_*** — (선택) 매직링크/알림 이메일. 비워두면 이메일은 건너뜀.
- **NEXT_PUBLIC_VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY / VAPID_SUBJECT** — 웹 푸시.
- **CRON_SECRET** — 아래 3) 참고. 비워두면 로컬에서 cron 엔드포인트가 인증 없이 열림(개발용).

## 2) Prisma (v7)

Prisma 7 은 Rust-free `client` 엔진이라 런타임에 **드라이버 어댑터**가 필요합니다 (`@prisma/adapter-pg` + `pg`, `lib/prisma.ts` 에 적용됨). `prisma.config.ts` 가 `.env.local` → `.env` 순으로 로드하므로 아래 CLI 가 그대로 동작합니다. (v7 에선 `binaries.prisma.sh` 엔진 다운로드가 없어 과거 회사망 SSL 이슈는 대부분 사라짐.)

```powershell
npx prisma generate     # client 생성
npx prisma db push      # 스키마를 DB에 반영 (초기/프로토타이핑)
npm run seed            # 샘플 데이터 (어머니 + 자식 매직링크 토큰 + 일정)
```

로컬에 DB 가 없으면 일회용 Postgres 를 띄울 수 있습니다:

```powershell
docker run -d --name minds-pg -e POSTGRES_PASSWORD=minds -e POSTGRES_USER=minds -e POSTGRES_DB=minds -p 5433:5432 postgres:16-alpine
docker exec minds-pg psql -U minds -d minds -c "CREATE DATABASE minds_shadow;"
# .env.local 의 DATABASE_URL=postgresql://minds:minds@localhost:5433/minds, DIRECT_URL=...minds_shadow
```

## 3) 알림 cron (GitHub Actions)

`.github/workflows/reminders.yml` 가 15분마다 `POST /api/cron/reminders` 를 호출해 예정된 약/일정 푸시를 보냅니다.

**필요한 GitHub repo secrets**:

- `APP_URL` — 배포 주소 (예: `https://minds.vercel.app`)
- `CRON_SECRET` — 앱의 `CRON_SECRET` env 와 **같은 값**. cron/send 엔드포인트는 이 값이 설정돼 있으면 `Authorization: Bearer <CRON_SECRET>` 헤더를 요구합니다.

설정 방법:

```powershell
# 1) 비밀값 생성
node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"

# 2) GitHub repo 에 secret 등록 (gh CLI)
gh secret set APP_URL --body "https://<your-deploy-domain>"
gh secret set CRON_SECRET --body "<위에서 생성한 값>"

# 3) 같은 CRON_SECRET 값을 배포 플랫폼(Vercel) env 에도 등록
#    Vercel: Project → Settings → Environment Variables → CRON_SECRET
```

> Vercel Cron 을 쓴다면 GitHub Actions 대신 `vercel.json` 의 crons 로 `/api/cron/reminders` 를 호출해도 됩니다. 이 경우 `reminders.yml` 은 비활성화하세요.

## 4) 웹 푸시 VAPID 키

```powershell
node -e "console.log(require('web-push').generateVAPIDKeys())"
```

출력의 publicKey → `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, privateKey → `VAPID_PRIVATE_KEY` 에 넣습니다.
