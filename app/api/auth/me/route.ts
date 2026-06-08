import { NextResponse } from "next/server";
import { getOrCreateUser } from "../../../../lib/auth";

export async function GET() {
  const mapped = await getOrCreateUser();
  if (!mapped) return NextResponse.json({ ok: false, message: "not authenticated" }, { status: 401 });

  return NextResponse.json({ ok: true, user: mapped.prismaUser });
}
