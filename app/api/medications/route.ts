import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { getOrCreateUser } from "../../../lib/auth";

export async function POST(req: Request) {
  const mapped = await getOrCreateUser();
  const body = await req.json().catch(() => ({}));

  // allow dev mode with userId in body (local testing without login)
  const userId = mapped?.prismaUser.id ?? body.userId ?? null;
  if (!userId) {
    return NextResponse.json({ ok: false, message: "로그인이 필요합니다. 다시 해주세요." }, { status: 401 });
  }

  const { name, schedule } = body;
  if (!name || typeof name !== "string") {
    return NextResponse.json({ ok: false, message: "약 이름을 적어주세요." }, { status: 400 });
  }
  if (!schedule || typeof schedule !== "object" || Array.isArray(schedule)) {
    return NextResponse.json({ ok: false, message: "약 먹는 시간을 정해주세요." }, { status: 400 });
  }

  try {
    const rec = await prisma.medication.create({
      data: {
        userId,
        name,
        schedule,
        dosage: body.dosage ?? undefined,
        startedAt: body.startedAt ? new Date(body.startedAt) : new Date(),
        note: body.note ?? undefined,
      },
    });
    return NextResponse.json({ ok: true, rec });
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
      where: { userId },
      take: 100,
    });
    return NextResponse.json({ data: items });
  } catch (err) {
    console.error("[medications GET]", err);
    return NextResponse.json({ ok: false, message: "불러오지 못했어요. 다시 해주세요." }, { status: 500 });
  }
}
