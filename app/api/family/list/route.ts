import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { getOrCreateUser } from "../../../../lib/auth";

// Lists the authenticated mother's own family members (which include access
// tokens). Requires the mother to be logged in — these tokens must never leak
// to other users.
export async function GET() {
  const mapped = await getOrCreateUser();
  if (!mapped) {
    return NextResponse.json({ ok: false, message: "로그인이 필요해요" }, { status: 401 });
  }

  try {
    const family = await prisma.familyMember.findMany({
      where: { userId: mapped.prismaUser.id },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ ok: true, family });
  } catch (err) {
    console.error("[family/list] failed:", (err as Error)?.message);
    return NextResponse.json({ ok: false, message: "불러오지 못했어요. 다시 해주세요." }, { status: 500 });
  }
}
