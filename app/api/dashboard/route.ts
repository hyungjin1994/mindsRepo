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

    return NextResponse.json({ ok: true, user: { id: user.id, name: user.name, points }, reminders, familyFeed });
  } catch (err: any) {
    return NextResponse.json({ ok: false, message: String(err?.message ?? err) }, { status: 500 });
  }
}
