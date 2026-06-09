import { NextResponse } from "next/server";
import { getOrCreateUser } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";

export async function GET() {
  try {
    const mapped = await getOrCreateUser();
    if (!mapped) {
      return NextResponse.json({ ok: true });
    }

    const user = mapped.prismaUser;
    const pointsAgg = await prisma.pointTransaction.aggregate({
      where: { userId: user.id },
      _sum: { amount: true },
    });
    const points = pointsAgg._sum.amount ?? 0;
    const reminders = await prisma.reminder.findMany({ where: { userId: user.id, completed: false }, orderBy: { scheduledAt: "asc" }, take: 10 });
    const familyFeed = await prisma.familyPost.findMany({ where: { recipientId: user.id }, orderBy: { createdAt: "desc" }, take: 10 });

    // 홈의 "게임 득점"용 — 가장 최근 게임 한 판 + 누적 판수.
    const lastGame = await prisma.gamePlay.findFirst({
      where: { userId: user.id },
      orderBy: { playedAt: "desc" },
      select: { score: true, totalItems: true, gameType: true, playedAt: true, pointsEarned: true },
    });
    const gameCount = await prisma.gamePlay.count({ where: { userId: user.id } });

    return NextResponse.json({ ok: true, user: { id: user.id, name: user.name, points }, lastGame, gameCount, reminders, familyFeed });
  } catch (err: any) {
    return NextResponse.json({ ok: false, message: String(err?.message ?? err) }, { status: 500 });
  }
}
