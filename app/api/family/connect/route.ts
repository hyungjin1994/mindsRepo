import { NextResponse } from "next/server";
import crypto from "crypto";
import { FamilyRole } from "@prisma/client";
import { prisma } from "../../../../lib/prisma";
import { getOrCreateUser } from "../../../../lib/auth";

// 엄마(로그인 사용자)가 자녀를 연결할 "코드"를 발급한다.
// 코드는 FamilyMember.accessToken 으로 저장되어, 자녀는 /connect 에서 코드를 입력하거나
// /family/<코드> 링크로 바로 접속할 수 있다.

const ROLES: FamilyRole[] = ["CHILD", "CHILD_IN_LAW", "GRANDCHILD", "OTHER"];
// 헷갈리는 글자(0/O/1/I/L) 제외 — 어르신·자녀가 받아쓰기 쉽게.
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function makeCode(len = 6): string {
  const bytes = crypto.randomBytes(len);
  let s = "";
  for (let i = 0; i < len; i++) s += ALPHABET[bytes[i] % ALPHABET.length];
  return s;
}

export async function POST(req: Request) {
  const mapped = await getOrCreateUser();
  if (!mapped) {
    return NextResponse.json({ ok: false, message: "로그인이 필요해요" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const name = String(body?.name ?? "").trim();
  if (!name) {
    return NextResponse.json({ ok: false, message: "가족의 이름(호칭)을 적어주세요." }, { status: 400 });
  }
  const role: FamilyRole = ROLES.includes(body?.role) ? body.role : "CHILD";

  try {
    // 충돌 없는 코드 확보 (accessToken 은 unique).
    let code = "";
    for (let attempt = 0; attempt < 6; attempt++) {
      const candidate = makeCode(6);
      const existing = await prisma.familyMember.findUnique({ where: { accessToken: candidate } });
      if (!existing) {
        code = candidate;
        break;
      }
    }
    if (!code) {
      return NextResponse.json({ ok: false, message: "코드를 만들지 못했어요. 다시 해주세요." }, { status: 500 });
    }

    const member = await prisma.familyMember.create({
      data: { userId: mapped.prismaUser.id, name, role, accessToken: code },
    });

    const base = process.env.NEXT_PUBLIC_APP_URL || "";
    return NextResponse.json({
      ok: true,
      code,
      link: `${base}/family/${code}`,
      member: { id: member.id, name: member.name, role: member.role, accessToken: member.accessToken },
    });
  } catch (err) {
    console.error("[family/connect] failed:", (err as Error)?.message);
    return NextResponse.json({ ok: false, message: "코드를 만들지 못했어요. 다시 해주세요." }, { status: 500 });
  }
}
