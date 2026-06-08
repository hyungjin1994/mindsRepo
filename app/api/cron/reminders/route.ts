import { NextResponse } from "next/server";
import webpush from "web-push";
import { prisma } from "../../../../lib/prisma";
import { sendMail } from "../../../../lib/email";

let cronSecretWarned = false;

// CRON_SECRET 가 설정돼 있으면 Authorization: Bearer <secret> 헤더를 요구.
// 설정돼 있지 않으면 로컬 개발용으로 허용하되 한 번만 경고.
function authorizeCron(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    if (!cronSecretWarned) {
      console.warn("[cron/reminders] CRON_SECRET 미설정 — 인증 없이 알림 전송 허용 (로컬 개발 전용)");
      cronSecretWarned = true;
    }
    return true;
  }
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

// 사용자 타임존 기준 현재 시각(HH:MM)이 방해 금지(DND) 구간 안인지 판단.
// dndStart/dndEnd 는 "HH:MM" 문자열이며 자정을 넘길 수 있음 (예: 21:00~08:00).
function isWithinDnd(now: Date, timezone: string, dndStart: string, dndEnd: string): boolean {
  let nowMinutes: number;
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(now);
    const h = Number(parts.find((p) => p.type === "hour")?.value ?? "0") % 24;
    const m = Number(parts.find((p) => p.type === "minute")?.value ?? "0");
    nowMinutes = h * 60 + m;
  } catch {
    // 알 수 없는 타임존이면 DND 미적용 (전송 허용)
    return false;
  }

  const toMin = (s: string) => {
    const [h, m] = (s ?? "").split(":").map((n) => Number(n));
    if (Number.isNaN(h) || Number.isNaN(m)) return null;
    return h * 60 + m;
  };
  const start = toMin(dndStart);
  const end = toMin(dndEnd);
  if (start === null || end === null) return false;
  if (start === end) return false; // 빈 구간

  if (start < end) {
    // 같은 날 구간 (예: 13:00~15:00)
    return nowMinutes >= start && nowMinutes < end;
  }
  // 자정을 넘는 구간 (예: 21:00~08:00)
  return nowMinutes >= start || nowMinutes < end;
}

export async function POST(req: Request) {
  if (!authorizeCron(req)) {
    return NextResponse.json({ ok: false, message: "권한이 없어요." }, { status: 401 });
  }
  try {
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    if (publicKey && privateKey) webpush.setVapidDetails(process.env.VAPID_SUBJECT || "mailto:admin@example.com", publicKey, privateKey);

    const now = new Date();
    const due = await prisma.reminder.findMany({ where: { scheduledAt: { lte: now }, notified: false, completed: false }, take: 200 });

    const results: any[] = [];
    for (const r of due) {
      try {
        const user = await prisma.user.findUnique({ where: { id: r.userId } });

        // 방해 금지 시간대면 건너뜀 (notified 도 갱신하지 않아 다음 주기에 다시 시도)
        if (user && isWithinDnd(now, user.timezone, user.dndStart, user.dndEnd)) {
          results.push({ reminderId: r.id, status: "skipped-dnd" });
          continue;
        }

        const subs = await prisma.pushSubscription.findMany({ where: { userId: r.userId } });

        const payload = JSON.stringify({ title: `리마인더: ${r.title}`, body: r.note ?? "" });

        // send push notifications
        const pushResults: any[] = [];
        if (subs.length && publicKey && privateKey) {
          for (const s of subs) {
            try {
              await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } } as any, payload);
              pushResults.push({ id: s.id, status: "ok" });
            } catch (err: any) {
              pushResults.push({ id: s.id, status: "error", message: err?.message });
            }
          }
        }

        // send email fallback
        let emailResult = null;
        if (user?.email) {
          try {
            await sendMail(user.email, `리마인더: ${r.title}`, `${r.title}\n\n${r.note ?? ""}`);
            emailResult = { ok: true };
          } catch (e) {
            emailResult = { ok: false, error: String(e) };
          }
        }

        await prisma.reminder.update({ where: { id: r.id }, data: { notified: true } });

        results.push({ reminderId: r.id, push: pushResults, email: emailResult });
      } catch (e) {
        results.push({ reminderId: r.id, error: String(e) });
      }
    }

    return NextResponse.json({ ok: true, processed: results.length, results });
  } catch (err: any) {
    console.error("[cron/reminders] failed", err);
    return NextResponse.json({ ok: false, message: "알림을 보내지 못했어요. 다시 해주세요." }, { status: 500 });
  }
}
