import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { getOrCreateUser } from "../../../../lib/auth";

export async function POST(req: Request) {
  const mapped = await getOrCreateUser();
  const userId = mapped?.prismaUser.id;
  if (!userId) return NextResponse.json({ ok: false, message: "not authenticated" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { endpoint, p256dh, auth: authKey, userAgent } = body;
  if (!endpoint || !p256dh || !authKey) return NextResponse.json({ ok: false, message: "missing subscription" }, { status: 400 });

  const s = await prisma.pushSubscription.upsert({
    where: { endpoint },
    // userId 포함 — 재구독 시 소유권이 오래된 사용자로 남지 않도록 갱신
    update: { userId, p256dh, auth: authKey, lastSeenAt: new Date(), userAgent },
    create: { userId, endpoint, p256dh, auth: authKey, userAgent },
  });

  return NextResponse.json({ ok: true, subscription: s });
}
