import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

// CHILD sends a post to the mother. Children have no Supabase login — they are
// authenticated solely by their permanent magic-link accessToken.
// CONTRACT: the child page sends { senderAccessToken, text } (imageUrl/kind optional).
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { senderAccessToken, text, imageUrl, kind, recipientId } = body;

  if (!senderAccessToken) {
    return NextResponse.json({ ok: false, message: "유효하지 않은 링크예요" }, { status: 403 });
  }

  try {
    // Authenticate the family member by their access token.
    const sender = await prisma.familyMember.findUnique({ where: { accessToken: senderAccessToken } });
    if (!sender) {
      return NextResponse.json({ ok: false, message: "유효하지 않은 링크예요" }, { status: 403 });
    }

    // The recipient is always the mother this child belongs to. Never trust a
    // client-supplied recipientId — if one is sent it must match the sender's mother.
    if (recipientId && recipientId !== sender.userId) {
      return NextResponse.json({ ok: false, message: "유효하지 않은 링크예요" }, { status: 403 });
    }

    const post = await prisma.familyPost.create({
      data: {
        recipientId: sender.userId,
        senderId: sender.id,
        kind: imageUrl ? "PHOTO" : (kind ?? "MESSAGE"),
        text: text ?? undefined,
        imageUrl: imageUrl ?? undefined,
      },
    });

    // Track when this child last interacted.
    await prisma.familyMember.update({
      where: { id: sender.id },
      data: { lastSeenAt: new Date() },
    });

    return NextResponse.json({ ok: true, post });
  } catch (err) {
    console.error("[family/post] failed:", (err as Error)?.message);
    return NextResponse.json({ ok: false, message: "보내지 못했어요. 다시 해주세요." }, { status: 500 });
  }
}
