import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

// 자녀가 입력한 연결 코드가 유효한지 확인한다 (로그인 불필요).
// 토큰 전체를 노출하지 않고 유효 여부와 호칭/엄마 이름 정도만 돌려준다.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = (searchParams.get("code") ?? "").trim().toUpperCase();
  if (!code) {
    return NextResponse.json({ ok: true, valid: false });
  }

  try {
    const member = await prisma.familyMember.findUnique({ where: { accessToken: code } });
    if (!member || !member.isActive) {
      return NextResponse.json({ ok: true, valid: false });
    }
    const mom = await prisma.user.findUnique({ where: { id: member.userId }, select: { name: true } });
    return NextResponse.json({ ok: true, valid: true, name: member.name, motherName: mom?.name ?? null });
  } catch (err) {
    console.error("[family/resolve] failed:", (err as Error)?.message);
    return NextResponse.json({ ok: false, valid: false, message: "확인하지 못했어요. 다시 해주세요." }, { status: 500 });
  }
}
