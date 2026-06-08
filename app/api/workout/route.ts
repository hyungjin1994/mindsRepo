import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { getOrCreateUser } from "../../../lib/auth";

const WORKOUT_TYPES = [
  "AQUA_WALKING",
  "GYM",
  "WALKING",
  "YOGA",
  "PHYSICAL_THERAPY",
  "OTHER",
] as const;

export async function POST(req: Request) {
  const mapped = await getOrCreateUser();
  const body = await req.json().catch(() => ({}));

  // allow dev mode with userId in body (local testing without login)
  const userId = mapped?.prismaUser.id ?? body.userId ?? null;
  if (!userId) {
    return NextResponse.json({ ok: false, message: "로그인이 필요합니다. 다시 해주세요." }, { status: 401 });
  }

  const { type, title } = body;
  if (!type || !WORKOUT_TYPES.includes(type)) {
    return NextResponse.json({ ok: false, message: "운동 종류를 골라주세요." }, { status: 400 });
  }
  if (!title || typeof title !== "string") {
    return NextResponse.json({ ok: false, message: "운동 이름을 적어주세요." }, { status: 400 });
  }

  try {
    const rec = await prisma.workout.create({
      data: {
        userId,
        type: type as (typeof WORKOUT_TYPES)[number],
        title,
        schedule: body.schedule ?? undefined,
        performedAt: body.performedAt ? new Date(body.performedAt) : undefined,
        durationMin:
          body.durationMin !== undefined && body.durationMin !== null
            ? Number(body.durationMin)
            : undefined,
        note: body.note ?? undefined,
      },
    });
    return NextResponse.json({ ok: true, rec });
  } catch (err) {
    console.error("[workout POST]", err);
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
    const items = await prisma.workout.findMany({
      where: { userId },
      take: 50,
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ data: items });
  } catch (err) {
    console.error("[workout GET]", err);
    return NextResponse.json({ ok: false, message: "불러오지 못했어요. 다시 해주세요." }, { status: 500 });
  }
}
