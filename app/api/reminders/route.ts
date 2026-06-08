import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { getOrCreateUser } from "../../../lib/auth";

const REMINDER_KINDS = ["MEDICATION", "HOSPITAL", "WORKOUT", "FAMILY_EVENT", "OTHER"] as const;
type ReminderKind = (typeof REMINDER_KINDS)[number];

export async function GET(req: Request) {
  const mapped = await getOrCreateUser();
  const queryUserId = new URL(req.url).searchParams.get("userId");
  const userId = mapped?.prismaUser.id ?? queryUserId;
  if (!userId) return NextResponse.json({ ok: false, message: "로그인이 필요해요. 다시 해주세요." }, { status: 401 });

  const items = await prisma.reminder.findMany({ where: { userId }, orderBy: { scheduledAt: "asc" } });
  return NextResponse.json({ ok: true, reminders: items });
}

export async function POST(req: Request) {
  const mapped = await getOrCreateUser();
  let userId: string | null = mapped?.prismaUser.id ?? null;

  const body = await req.json().catch(() => ({}));

  // 개발 모드 fallback: 로그인 없이 body.userId 로 테스트 허용
  userId = userId ?? body.userId ?? null;
  if (!userId) return NextResponse.json({ ok: false, message: "로그인이 필요해요. 다시 해주세요." }, { status: 401 });

  const { kind, title, scheduledAt, note } = body;

  if (!REMINDER_KINDS.includes(kind as ReminderKind)) {
    return NextResponse.json({ ok: false, message: "알림 종류를 골라주세요." }, { status: 400 });
  }
  if (!title || typeof title !== "string" || !title.trim()) {
    return NextResponse.json({ ok: false, message: "제목을 적어주세요." }, { status: 400 });
  }
  const when = new Date(scheduledAt);
  if (Number.isNaN(when.getTime())) {
    return NextResponse.json({ ok: false, message: "날짜와 시간을 다시 골라주세요." }, { status: 400 });
  }

  try {
    const reminder = await prisma.reminder.create({
      data: {
        userId,
        kind: kind as ReminderKind,
        title: title.trim(),
        scheduledAt: when,
        note: typeof note === "string" && note.trim() ? note.trim() : null,
      },
    });
    return NextResponse.json({ ok: true, reminder });
  } catch (err) {
    console.error("[reminders POST] create failed", err);
    return NextResponse.json({ ok: false, message: "알림을 저장하지 못했어요. 다시 해주세요." }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const mapped = await getOrCreateUser();
  const body = await req.json().catch(() => ({}));
  const { id, completed } = body;

  // 개발 모드 fallback: 로그인 없이 body.userId 로 테스트 허용
  const userId = mapped?.prismaUser.id ?? body.userId ?? null;
  if (!userId) return NextResponse.json({ ok: false, message: "로그인이 필요해요. 다시 해주세요." }, { status: 401 });
  if (!id) return NextResponse.json({ ok: false, message: "알림을 찾을 수 없어요. 다시 해주세요." }, { status: 400 });

  // 소유권 확인 — 본인 알림만 수정 가능
  const existing = await prisma.reminder.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ ok: false, message: "알림을 찾을 수 없어요. 다시 해주세요." }, { status: 404 });
  if (existing.userId !== userId) {
    return NextResponse.json({ ok: false, message: "이 알림은 수정할 수 없어요." }, { status: 403 });
  }

  try {
    const r = await prisma.reminder.update({ where: { id }, data: { completed: !!completed } });
    return NextResponse.json({ ok: true, reminder: r });
  } catch (err) {
    console.error("[reminders PATCH] update failed", err);
    return NextResponse.json({ ok: false, message: "알림을 저장하지 못했어요. 다시 해주세요." }, { status: 500 });
  }
}
