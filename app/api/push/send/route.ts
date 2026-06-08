import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import webpush from 'web-push';

let cronSecretWarned = false;

// CRON_SECRET 가 설정돼 있으면 Authorization: Bearer <secret> 헤더를 요구.
// 설정돼 있지 않으면 로컬 개발용으로 허용하되 한 번만 경고.
function authorizeCron(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    if (!cronSecretWarned) {
      console.warn('[push/send] CRON_SECRET 미설정 — 인증 없이 알림 전송 허용 (로컬 개발 전용)');
      cronSecretWarned = true;
    }
    return true;
  }
  return req.headers.get('authorization') === `Bearer ${secret}`;
}

// POST { title, body }
export async function POST(req: NextRequest) {
  if (!authorizeCron(req)) {
    return NextResponse.json({ message: '권한이 없어요.' }, { status: 401 });
  }
  try {
    const data = await req.json();
    const { title = '알림', body = '' } = data;

    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    if (!publicKey || !privateKey) return NextResponse.json({ message: 'VAPID 키 미설정' }, { status: 500 });

    webpush.setVapidDetails(process.env.VAPID_SUBJECT || 'mailto:admin@example.com', publicKey, privateKey);

    const { prisma } = await import('../../../../lib/prisma');
    const subs = await prisma.pushSubscription.findMany({});

    const payload = JSON.stringify({ title, body });
    const results = [] as any[];
    for (const s of subs) {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } } as any, payload);
        results.push({ id: s.id, status: 'ok' });
      } catch (err: any) {
        results.push({ id: s.id, status: 'error', message: err?.message });
      }
    }

    return NextResponse.json({ sent: results.length, results });
  } catch (err: any) {
    console.error('[push/send] failed', err);
    return NextResponse.json({ message: '알림을 보내지 못했어요. 다시 해주세요.' }, { status: 500 });
  }
}
