import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { getOrCreateUser } from "../../../../lib/auth";
import { createAdminClient } from "../../../../lib/supabase/admin";

// 사진 업로드 → Supabase Storage 저장 + Photo 레코드 생성 + 포인트 5점 적립.
//
// 인증: 로그인한 어머니의 userId 를 getOrCreateUser() 에서 가져온다.
// 로컬 테스트(로그인 없이)를 위해 body.userId 폴백을 허용하되,
// 로그인 상태에서 body.userId 가 인증 사용자와 다르면 거부(403)한다.

const MAX_BYTES = 5 * 1024 * 1024; // 5MB

// data-URL prefix(예: "data:image/png;base64,...") 또는 파일 확장자로 이미지 타입 추론.
function detectImage(raw: string, filename: string): { contentType: string; ext: string } | null {
  const dataUrl = /^data:(image\/(png|jpeg|webp|gif));base64,/i.exec(raw);
  if (dataUrl) {
    const contentType = dataUrl[1].toLowerCase();
    const sub = dataUrl[2].toLowerCase();
    return { contentType, ext: sub === "jpeg" ? "jpg" : sub };
  }

  const m = /\.([a-z0-9]+)$/i.exec(filename ?? "");
  const ext = m ? m[1].toLowerCase() : "";
  switch (ext) {
    case "png":
      return { contentType: "image/png", ext: "png" };
    case "jpg":
    case "jpeg":
      return { contentType: "image/jpeg", ext: "jpg" };
    case "webp":
      return { contentType: "image/webp", ext: "webp" };
    case "gif":
      return { contentType: "image/gif", ext: "gif" };
    default:
      return null;
  }
}

export async function POST(req: Request) {
  const mapped = await getOrCreateUser();
  const body = await req.json().catch(() => ({}));

  // 인증된 어머니 우선. 로그인 안 된 로컬 테스트에서는 body.userId 폴백 허용.
  const authedId = mapped ? mapped.prismaUser.id : null;
  const userId: string | null = authedId ?? body.userId ?? null;
  if (!userId) {
    return NextResponse.json({ ok: false, message: "로그인이 필요해요." }, { status: 401 });
  }

  // 로그인 상태인데 다른 사람의 userId 로 올리려 하면 거부.
  if (authedId && body.userId && body.userId !== authedId) {
    return NextResponse.json({ ok: false, message: "권한이 없어요." }, { status: 403 });
  }

  // 도배 방지(rate limit): 같은 사용자가 너무 짧은 간격으로 연속 업로드 못하게.
  // DB의 마지막 사진 시각으로 판단 → 서버 인스턴스가 여러 개여도 동작.
  const MIN_INTERVAL_MS = 8000;
  try {
    const last = await prisma.photo.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    });
    if (last && Date.now() - last.createdAt.getTime() < MIN_INTERVAL_MS) {
      return NextResponse.json(
        { ok: false, message: "조금 뒤에 다시 올려주세요." },
        { status: 429 },
      );
    }
  } catch (e) {
    // 레이트리밋 조회 실패는 업로드를 막지 않는다 (best-effort).
    console.warn("[uploads/photo] rate-limit check skipped:", (e as Error)?.message);
  }

  const base64: unknown = body.base64;
  if (typeof base64 !== "string" || base64.length === 0) {
    return NextResponse.json({ ok: false, message: "사진을 다시 선택해주세요." }, { status: 400 });
  }

  const filename: string = typeof body.filename === "string" ? body.filename : "";
  const detected = detectImage(base64, filename);
  if (!detected) {
    return NextResponse.json(
      { ok: false, message: "사진 형식을 알 수 없어요. 다시 해주세요." },
      { status: 400 },
    );
  }

  // data-URL prefix 가 있으면 떼어내고 순수 base64 만 디코드.
  const commaIdx = base64.indexOf(",");
  const pureBase64 = base64.startsWith("data:") && commaIdx !== -1 ? base64.slice(commaIdx + 1) : base64;

  let buffer: Buffer;
  try {
    buffer = Buffer.from(pureBase64, "base64");
  } catch {
    return NextResponse.json({ ok: false, message: "사진을 다시 선택해주세요." }, { status: 400 });
  }

  if (buffer.byteLength === 0) {
    return NextResponse.json({ ok: false, message: "사진을 다시 선택해주세요." }, { status: 400 });
  }
  if (buffer.byteLength > MAX_BYTES) {
    return NextResponse.json({ ok: false, message: "사진이 너무 커요" }, { status: 413 });
  }

  const kind = body.kind === "MEAL" || body.kind === "OTHER" ? body.kind : "DAILY";
  const caption: string | null = typeof body.caption === "string" && body.caption.trim() ? body.caption.trim() : null;

  // 충돌 없는 저장 경로: 사용자 폴더 / 타임스탬프 + 랜덤 + 확장자.
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const path = `${userId}/${unique}.${detected.ext}`;

  let url: string;
  let thumbUrl: string | null = null;
  try {
    const supabase = createAdminClient();

    const upload = await supabase.storage
      .from("photos")
      .upload(path, buffer, { contentType: detected.contentType });
    if (upload.error) {
      console.error("[uploads/photo] storage upload failed:", upload.error.message);
      return NextResponse.json(
        { ok: false, message: "사진 저장에 실패했어요. 다시 해주세요." },
        { status: 500 },
      );
    }

    url = supabase.storage.from("photos").getPublicUrl(path).data.publicUrl;

    // 클라이언트가 만든 썸네일이 있으면 함께 저장. 실패해도 본 사진은 유지.
    if (typeof body.thumbBase64 === "string" && body.thumbBase64.length > 0) {
      const tDetected = detectImage(body.thumbBase64, "");
      if (tDetected) {
        const tComma = body.thumbBase64.indexOf(",");
        const tPure =
          body.thumbBase64.startsWith("data:") && tComma !== -1
            ? body.thumbBase64.slice(tComma + 1)
            : body.thumbBase64;
        try {
          const tBuf = Buffer.from(tPure, "base64");
          if (tBuf.byteLength > 0 && tBuf.byteLength <= MAX_BYTES) {
            const tPath = `${userId}/${unique}-thumb.${tDetected.ext}`;
            const tUp = await supabase.storage
              .from("photos")
              .upload(tPath, tBuf, { contentType: tDetected.contentType });
            if (!tUp.error) {
              thumbUrl = supabase.storage.from("photos").getPublicUrl(tPath).data.publicUrl;
            }
          }
        } catch (te) {
          console.warn("[uploads/photo] thumb upload skipped:", (te as Error)?.message);
        }
      }
    }
  } catch (e) {
    // Supabase Storage 미설정 / 네트워크 오류 등 — 스택 노출 없이 평범한 한글로.
    console.error("[uploads/photo] storage error:", (e as Error)?.message);
    return NextResponse.json(
      { ok: false, message: "사진 저장에 실패했어요. 다시 해주세요." },
      { status: 500 },
    );
  }

  try {
    const photo = await prisma.photo.create({
      data: { userId, kind: kind as any, url, thumbUrl, caption },
    });

    // 사진 업로드 포인트 적립 (5점).
    const PHOTO_POINTS = 5;
    await prisma.pointTransaction.create({
      data: {
        userId,
        kind: "EARN_PHOTO",
        amount: PHOTO_POINTS,
        reason: "사진 업로드",
        metadata: { photoId: photo.id },
      },
    });
    await prisma.user.update({
      where: { id: userId },
      data: { points: { increment: PHOTO_POINTS } },
    });

    return NextResponse.json({ ok: true, photo, url });
  } catch (e) {
    console.error("[uploads/photo] db error:", (e as Error)?.message);
    return NextResponse.json(
      { ok: false, message: "사진 저장에 실패했어요. 다시 해주세요." },
      { status: 500 },
    );
  }
}

// 어머니 본인이 올린 사진 목록 (가족 탭의 "내가 올린 사진"용).
export async function GET() {
  const mapped = await getOrCreateUser();
  if (!mapped) {
    return NextResponse.json({ ok: false, message: "로그인이 필요해요." }, { status: 401 });
  }
  try {
    const photos = await prisma.photo.findMany({
      where: { userId: mapped.prismaUser.id },
      orderBy: { createdAt: "desc" },
      take: 12,
      select: { id: true, url: true, thumbUrl: true, caption: true, kind: true, takenAt: true },
    });
    return NextResponse.json({ ok: true, photos });
  } catch (e) {
    console.error("[uploads/photo] GET failed:", (e as Error)?.message);
    return NextResponse.json({ ok: false, message: "불러오지 못했어요. 다시 해주세요." }, { status: 500 });
  }
}
