import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { getOrCreateUser } from "../../../lib/auth";

// 약 = 이름 + 복용 시간(HH:MM 목록). 등록하면 앞으로 2주치 복용 알림(리마인더)을 자동 생성해,
// 켜둔 푸시 알림으로 복용 시간에 알림이 가도록 한다. (스케줄러: .github/workflows/reminders.yml)

const HHMM = /^([01]\d|2[0-3]):([0-5]\d)$/;
const HORIZON_DAYS = 14;

// KST(UTC+9) 벽시계 HH:MM 을 dayOffset 일 뒤의 실제 UTC 시각으로 변환.
function kstDoseToUtc(dayOffset: number, hh: number, mm: number): Date {
  const kst = new Date(Date.now() + 9 * 3600 * 1000);
  return new Date(
    Date.UTC(kst.getUTCFullYear(), kst.getUTCMonth(), kst.getUTCDate() + dayOffset, hh, mm) - 9 * 3600 * 1000,
  );
}

export async function POST(req: Request) {
  const mapped = await getOrCreateUser();
  const body = await req.json().catch(() => ({}));
  const userId = mapped?.prismaUser.id ?? body.userId ?? null;
  if (!userId) {
    return NextResponse.json({ ok: false, message: "로그인이 필요합니다. 다시 해주세요." }, { status: 401 });
  }

  const name = String(body?.name ?? "").trim();
  if (!name) {
    return NextResponse.json({ ok: false, message: "약 이름을 적어주세요." }, { status: 400 });
  }
  const rawTimes: unknown[] = Array.isArray(body?.times) ? body.times : [];
  const times: string[] = Array.from(
    new Set(rawTimes.filter((t): t is string => typeof t === "string" && HHMM.test(t))),
  ).sort();
  if (times.length === 0) {
    return NextResponse.json({ ok: false, message: "약 먹는 시간을 한 개 이상 골라주세요." }, { status: 400 });
  }
  const dosage = body?.dosage ? String(body.dosage) : undefined;
  const note = body?.note ? String(body.note) : undefined;

  try {
    const med = await prisma.medication.create({
      data: { userId, name, schedule: { times }, dosage, note },
    });

    // 앞으로 2주치 복용 알림 생성 (지난 시각은 제외).
    const now = Date.now();
    const reminders: { userId: string; kind: "MEDICATION"; title: string; scheduledAt: Date; note: string | null }[] = [];
    for (let d = 0; d < HORIZON_DAYS; d++) {
      for (const t of times) {
        const [hh, mm] = t.split(":").map(Number);
        const when = kstDoseToUtc(d, hh, mm);
        if (when.getTime() > now) {
          reminders.push({ userId, kind: "MEDICATION", title: `💊 ${name}`, scheduledAt: when, note: dosage ?? null });
        }
      }
    }
    if (reminders.length) await prisma.reminder.createMany({ data: reminders });

    return NextResponse.json({ ok: true, medication: med, remindersCreated: reminders.length });
  } catch (err) {
    console.error("[medications POST]", err);
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
    const items = await prisma.medication.findMany({
      where: { userId, stoppedAt: null },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return NextResponse.json({ ok: true, data: items });
  } catch (err) {
    console.error("[medications GET]", err);
    return NextResponse.json({ ok: false, message: "불러오지 못했어요. 다시 해주세요." }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const mapped = await getOrCreateUser();
  const userId = mapped?.prismaUser.id ?? null;
  if (!userId) {
    return NextResponse.json({ ok: false, message: "로그인이 필요합니다. 다시 해주세요." }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ ok: false, message: "다시 해주세요." }, { status: 400 });
  }

  try {
    const med = await prisma.medication.findUnique({ where: { id } });
    if (!med || med.userId !== userId) {
      return NextResponse.json({ ok: false, message: "찾지 못했어요." }, { status: 404 });
    }
    // 아직 보내지 않은 미래 복용 알림 정리.
    await prisma.reminder.deleteMany({
      where: { userId, kind: "MEDICATION", title: `💊 ${med.name}`, scheduledAt: { gt: new Date() }, notified: false },
    });
    await prisma.medication.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[medications DELETE]", err);
    return NextResponse.json({ ok: false, message: "삭제하지 못했어요. 다시 해주세요." }, { status: 500 });
  }
}
