import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

// 자녀(연결 코드 보유)가 어머니의 최근 사진을 볼 수 있게 한다. 로그인 불필요.
// 코드(=FamilyMember.accessToken)로 어머니를 찾아 그분의 사진만 돌려준다.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = (searchParams.get("token") ?? "").trim();
  if (!token) {
    return NextResponse.json({ ok: false, photos: [] }, { status: 400 });
  }

  try {
    const member = await prisma.familyMember.findUnique({ where: { accessToken: token } });
    if (!member || !member.isActive) {
      return NextResponse.json({ ok: false, photos: [] }, { status: 404 });
    }
    const mom = await prisma.user.findUnique({ where: { id: member.userId }, select: { name: true } });
    const photos = await prisma.photo.findMany({
      where: { userId: member.userId },
      orderBy: { createdAt: "desc" },
      take: 12,
      select: { id: true, url: true, thumbUrl: true, caption: true, takenAt: true },
    });
    return NextResponse.json({ ok: true, motherName: mom?.name ?? null, photos });
  } catch (e) {
    console.error("[family/photos] failed:", (e as Error)?.message);
    return NextResponse.json({ ok: false, photos: [] }, { status: 500 });
  }
}
