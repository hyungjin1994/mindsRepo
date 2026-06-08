import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { getOrCreateUser } from "../../../../lib/auth";

// Returns the authenticated mother's incoming family feed. Requires login so a
// mother only ever sees posts addressed to her.
// CONTRACT: the feed page reads .posts.
export async function GET() {
  const mapped = await getOrCreateUser();
  if (!mapped) {
    return NextResponse.json({ ok: false, message: "로그인이 필요해요" }, { status: 401 });
  }

  try {
    const posts = await prisma.familyPost.findMany({
      where: { recipientId: mapped.prismaUser.id },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { sender: true },
    });
    return NextResponse.json({ ok: true, posts });
  } catch (err) {
    console.error("[family/feed] failed:", (err as Error)?.message);
    return NextResponse.json({ ok: false, message: "불러오지 못했어요. 다시 해주세요." }, { status: 500 });
  }
}
