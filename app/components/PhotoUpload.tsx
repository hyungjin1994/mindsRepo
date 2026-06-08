"use client";

import React, { useState } from "react";

type PhotoKind = "DAILY" | "MEAL" | "OTHER";

const KIND_OPTIONS: { value: PhotoKind; label: string }[] = [
  { value: "DAILY", label: "일상" },
  { value: "MEAL", label: "식사" },
  { value: "OTHER", label: "기타" },
];

// 업로드 전에 브라우저에서 작은 썸네일(JPEG)을 만든다. 실패하면 null → 서버는 썸네일 없이 저장.
function makeThumb(file: File, maxDim = 320): Promise<string | null> {
  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.7));
      } catch {
        resolve(null);
      } finally {
        URL.revokeObjectURL(objectUrl);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(null);
    };
    img.src = objectUrl;
  });
}

export default function PhotoUpload({ userId }: { userId?: string }) {
  const [busy, setBusy] = useState(false);
  const [kind, setKind] = useState<PhotoKind>("DAILY");
  const [caption, setCaption] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!userId) {
      setOk(false);
      setMessage("로그인이 필요해요.");
      return;
    }

    setBusy(true);
    setMessage(null);
    setOk(false);

    const reader = new FileReader();
    reader.onerror = () => {
      setBusy(false);
      setOk(false);
      setMessage("사진을 읽지 못했어요. 다시 해주세요.");
    };
    reader.onload = async () => {
      try {
        // data-URL 전체를 보내면 서버가 형식을 추론하고 prefix 를 떼어냅니다.
        const base64 = reader.result as string;
        // 작은 썸네일을 미리 만들어 함께 전송 (피드에서 빠르게 보여주기 위함).
        const thumbBase64 = await makeThumb(file);
        const res = await fetch("/api/uploads/photo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            base64,
            thumbBase64: thumbBase64 ?? undefined,
            filename: file.name,
            kind,
            caption: caption.trim() || undefined,
          }),
        });
        const json = await res.json().catch(() => ({}));
        if (res.ok && json.ok) {
          setOk(true);
          setMessage("사진을 보냈어요. 가족이 곧 볼 수 있어요.");
          setCaption("");
        } else {
          setOk(false);
          setMessage(json?.message ?? "사진을 보내지 못했어요. 다시 해주세요.");
        }
      } catch {
        setOk(false);
        setMessage("사진을 보내지 못했어요. 다시 해주세요.");
      } finally {
        setBusy(false);
        // 같은 파일을 다시 고를 수 있도록 입력값 초기화.
        e.target.value = "";
      }
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="mt-4 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
      <h4 className="text-lg font-semibold">사진 올리기</h4>
      <p className="text-base text-zinc-600">식사나 일상 사진을 올리면 가족이 확인할 수 있어요.</p>

      {/* 사진 종류 선택 */}
      <fieldset className="mt-4">
        <legend className="text-base font-medium text-zinc-800">사진 종류</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {KIND_OPTIONS.map((opt) => {
            const selected = kind === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                aria-pressed={selected}
                aria-label={`사진 종류 ${opt.label}`}
                disabled={busy}
                onClick={() => setKind(opt.value)}
                className={
                  "min-h-[56px] rounded-lg border px-5 text-base font-medium focus:outline-none focus:ring-2 focus:ring-yellow-500 disabled:opacity-60 " +
                  (selected
                    ? "border-yellow-500 bg-yellow-100 text-zinc-900"
                    : "border-zinc-300 bg-white text-zinc-700")
                }
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* 설명(선택) */}
      <div className="mt-4">
        <label htmlFor="photo-caption" className="text-base font-medium text-zinc-800">
          설명 (선택)
        </label>
        <input
          id="photo-caption"
          type="text"
          value={caption}
          onChange={(ev) => setCaption(ev.target.value)}
          disabled={busy}
          placeholder="예: 오늘 점심"
          aria-label="사진 설명 (선택)"
          className="mt-2 w-full min-h-[56px] rounded-lg border border-zinc-300 px-4 text-base focus:outline-none focus:ring-2 focus:ring-yellow-500 disabled:opacity-60"
        />
      </div>

      {/* 사진 고르기 — 큰 라벨 영역 */}
      <div className="mt-4">
        <label
          htmlFor="photo-file"
          aria-label="사진 고르기"
          className="flex min-h-[56px] w-full cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-yellow-400 bg-yellow-50 px-4 py-3 text-center text-base font-medium text-zinc-800 focus-within:ring-2 focus-within:ring-yellow-500 hover:bg-yellow-100"
        >
          {busy ? "사진을 보내는 중이에요…" : "여기를 눌러 사진을 고르세요"}
        </label>
        <input
          id="photo-file"
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          onChange={handleFile}
          disabled={busy}
          className="sr-only"
        />
      </div>

      {message && (
        <div
          role="status"
          className={
            "mt-3 text-base font-medium " + (ok ? "text-green-700" : "text-red-700")
          }
        >
          {message}
        </div>
      )}
    </div>
  );
}
