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

export default function PhotoUpload({ userId, onUploaded }: { userId?: string; onUploaded?: () => void }) {
  const [busy, setBusy] = useState(false);
  const [kind, setKind] = useState<PhotoKind>("DAILY");
  const [caption, setCaption] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

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
        const base64 = reader.result as string;
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
          setMessage("사진을 올렸어요! 가족이 볼 수 있어요. (+5점)");
          setCaption("");
          onUploaded?.();
        } else {
          setOk(false);
          setMessage(json?.message ?? "사진을 올리지 못했어요. 다시 해주세요.");
        }
      } catch {
        setOk(false);
        setMessage("사진을 올리지 못했어요. 다시 해주세요.");
      } finally {
        setBusy(false);
        e.target.value = "";
      }
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="rounded-[1.75rem] bg-white p-6 shadow-soft">
      <h2 className="text-2xl font-bold text-zinc-900">📷 사진 올리기</h2>
      <p className="mt-1.5 text-base text-zinc-600">식사나 일상 사진을 올리면 가족이 볼 수 있어요.</p>

      {/* 사진 종류 */}
      <div className="mt-4 flex flex-wrap gap-2">
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
                "min-h-[52px] rounded-2xl border-2 px-5 text-base font-bold focus:outline-none focus-visible:ring-4 focus-visible:ring-amber-300 disabled:opacity-60 " +
                (selected
                  ? "border-amber-400 bg-amber-400 text-zinc-900"
                  : "border-amber-200 bg-white text-zinc-700 hover:bg-amber-50")
              }
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* 설명 */}
      <input
        type="text"
        value={caption}
        onChange={(ev) => setCaption(ev.target.value)}
        disabled={busy}
        placeholder="설명 (선택) — 예: 오늘 점심"
        aria-label="사진 설명 (선택)"
        className="mt-3 min-h-[56px] w-full rounded-2xl border-2 border-amber-200 px-4 text-lg focus:border-amber-400 focus:ring-4 focus:ring-amber-300 focus:outline-none disabled:opacity-60"
      />

      {/* 사진 고르기 */}
      <label
        htmlFor="photo-file"
        aria-label="사진 고르기"
        className="mt-3 flex min-h-[64px] w-full cursor-pointer items-center justify-center rounded-2xl border-2 border-dashed border-amber-400 bg-amber-50 px-4 py-3 text-center text-lg font-bold text-amber-800 hover:bg-amber-100"
      >
        {busy ? "사진을 올리는 중이에요…" : "📸 여기를 눌러 사진 고르기"}
      </label>
      <input
        id="photo-file"
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        onChange={handleFile}
        disabled={busy}
        className="sr-only"
      />

      {message && (
        <div
          role="status"
          aria-live="polite"
          className={
            "mt-3 rounded-2xl px-4 py-3 text-center text-base font-semibold " +
            (ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700")
          }
        >
          {message}
        </div>
      )}
    </div>
  );
}
