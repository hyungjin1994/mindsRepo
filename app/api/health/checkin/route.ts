import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { getOrCreateUser } from "../../../../lib/auth";

function toInt1to5(v: unknown): number | undefined {
  if (v === undefined || v === null || v === "") return undefined;
  const n = Number(v);
  if (!Number.isInteger(n) || n < 1 || n > 5) return undefined;
  return n;
}

export async function POST(req: Request) {
  const mapped = await getOrCreateUser();
  const body = await req.json().catch(() => ({}));

  // allow dev mode with userId in body (local testing without login)
  const userId = mapped?.prismaUser.id ?? body.userId ?? null;
  if (!userId) {
    return NextResponse.json({ ok: false, message: "로그인이 필요합니다. 다시 해주세요." }, { status: 401 });
  }

  if (!body.date) {
    return NextResponse.json({ ok: false, message: "날짜를 정해주세요." }, { status: 400 });
  }
  const date = new Date(body.date);
  if (isNaN(date.getTime())) {
    return NextResponse.json({ ok: false, message: "날짜를 정확히 적어주세요." }, { status: 400 });
  }

  const sleepHours =
    body.sleepHours !== undefined && body.sleepHours !== null && body.sleepHours !== ""
      ? Number(body.sleepHours)
      : undefined;
  const mood = toInt1to5(body.mood);
  const appetite = toInt1to5(body.appetite);
  const pain = toInt1to5(body.pain);
  const note = body.note ?? undefined;

  try {
    // @@unique([userId, date]) — upsert so re-checkin on the same day updates
    const rec = await prisma.healthCheckIn.upsert({
      where: { userId_date: { userId, date } },
      create: { userId, date, sleepHours, mood, appetite, pain, note },
      update: { sleepHours, mood, appetite, pain, note },
    });
    return NextResponse.json({ ok: true, rec });
  } catch (err) {
    console.error("[health/checkin POST]", err);
    return NextResponse.json({ ok: false, message: "저장하지 못했어요. 다시 해주세요." }, { status: 500 });
  }
}

export async function GET() {
  const mapped = await getOrCreateUser();
  const userId = mapped?.prismaUser.id ?? null;
  if (!userId) {
    return NextResponse.json({ ok: false, message: "로그인이 필요합니다. 다시 해주세요." }, { status: 401 });
  }

  try {
    const items = await prisma.healthCheckIn.findMany({
      where: { userId },
      take: 100,
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ data: items });
  } catch (err) {
    console.error("[health/checkin GET]", err);
    return NextResponse.json({ ok: false, message: "불러오지 못했어요. 다시 해주세요." }, { status: 500 });
  }
}
