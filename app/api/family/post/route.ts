import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { createAdminClient } from "../../../../lib/supabase/admin";

const MAX_BYTES = 5 * 1024 * 1024;

// 자녀가 보낸 base64 이미지를 photos 버킷에 저장하고 공개 URL 을 돌려준다.
async function uploadFamilyImage(ownerUserId: string, base64: string): Promise<string | null> {
  const m = /^data:(image\/(png|jpeg|webp|gif));base64,/i.exec(base64);
  const ext = m ? (m[2].toLowerCase() === "jpeg" ? "jpg" : m[2].toLowerCase()) : "jpg";
  const contentType = m ? m[1].toLowerCase() : "image/jpeg";
  const comma = base64.indexOf(",");
  const pure = comma !== -1 ? base64.slice(comma + 1) : base64;
  try {
    const buf = Buffer.from(pure, "base64");
    if (buf.byteLength === 0 || buf.byteLength > MAX_BYTES) return null;
    const path = `family/${ownerUserId}/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;
    const admin = createAdminClient();
    const up = await admin.storage.from("photos").upload(path, buf, { contentType });
    if (up.error) {
      console.error("[family/post] image upload failed:", up.error.message);
      return null;
    }
    return admin.storage.from("photos").getPublicUrl(path).data.publicUrl;
  } catch (e) {
    console.error("[family/post] image error:", (e as Error)?.message);
    return null;
  }
}

// CHILD sends a post to the mother. Children have no Supabase login — they are
// authenticated solely by their permanent magic-link accessToken.
// CONTRACT: the child page sends { senderAccessToken, text } (imageUrl/kind optional).
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { senderAccessToken, text, imageUrl: bodyImageUrl, imageBase64, kind, recipientId } = body;

  if (!senderAccessToken) {
    return NextResponse.json({ ok: false, message: "유효하지 않은 링크예요" }, { status: 403 });
  }
  const hasText = typeof text === "string" && text.trim().length > 0;
  if (!hasText && !imageBase64 && !bodyImageUrl) {
    return NextResponse.json({ ok: false, message: "보낼 내용을 적거나 사진을 골라주세요." }, { status: 400 });
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

    // 사진을 보냈으면(base64) 저장소에 올려 URL 을 얻는다.
    let imageUrl: string | null = typeof bodyImageUrl === "string" ? bodyImageUrl : null;
    if (!imageUrl && typeof imageBase64 === "string" && imageBase64.length > 0) {
      imageUrl = await uploadFamilyImage(sender.userId, imageBase64);
      if (!imageUrl) {
        return NextResponse.json({ ok: false, message: "사진을 보내지 못했어요. 다시 해주세요." }, { status: 500 });
      }
    }

    const post = await prisma.familyPost.create({
      data: {
        recipientId: sender.userId,
        senderId: sender.id,
        kind: imageUrl ? "PHOTO" : (kind ?? "MESSAGE"),
        text: hasText ? text.trim() : undefined,
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
