import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { getOrCreateUser } from "../../../../lib/auth";

// 사용자 화면 설정 저장 (글자 크기 / 고대비). 로그인한 어머니 본인만.
export async function PATCH(req: Request) {
  const mapped = await getOrCreateUser();
  if (!mapped) {
    return NextResponse.json({ ok: false, message: "로그인이 필요해요." }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const data: { highContrast?: boolean; fontScale?: number; name?: string } = {};
  if (typeof body.highContrast === "boolean") data.highContrast = body.highContrast;
  if (typeof body.fontScale === "number" && body.fontScale >= 0.8 && body.fontScale <= 2.5) {
    data.fontScale = body.fontScale;
  }
  if (typeof body.name === "string" && body.name.trim()) {
    data.name = body.name.trim().slice(0, 40);
  }
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ ok: false, message: "변경할 설정이 없어요." }, { status: 400 });
  }

  try {
    const user = await prisma.user.update({ where: { id: mapped.prismaUser.id }, data });
    return NextResponse.json({
      ok: true,
      settings: { highContrast: user.highContrast, fontScale: user.fontScale, name: user.name },
    });
  } catch (err) {
    console.error("[user/settings] PATCH failed:", err);
    return NextResponse.json({ ok: false, message: "설정을 저장하지 못했어요. 다시 해주세요." }, { status: 500 });
  }
}
