"use client";

import React, { useEffect, useState } from "react";

type Photo = { id: string; url: string; thumbUrl?: string | null; caption?: string | null };

// 큰 사진은 보내기 전에 최대 1280px JPEG 로 줄여 용량을 낮춘다.
function downscale(file: File, maxDim = 1280): Promise<string | null> {
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
        if (!ctx) return resolve(null);
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.8));
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

export default function FamilySendPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = React.use(params);
  const [motherName, setMotherName] = useState<string | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [message, setMessage] = useState("");
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  async function loadPhotos() {
    try {
      const res = await fetch(`/api/family/photos?token=${encodeURIComponent(token)}`);
      const j = await res.json();
      if (res.ok && j?.ok) {
        setMotherName(j.motherName ?? null);
        setPhotos(j.photos ?? []);
      }
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    loadPhotos();
  }, [token]);

  async function pickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatus("사진을 준비하는 중이에요…");
    const data = await downscale(file);
    if (data) {
      setImageBase64(data);
      setStatus(null);
    } else {
      setStatus("사진을 읽지 못했어요. 다시 골라주세요.");
    }
    e.target.value = "";
  }

  async function send() {
    if (!message.trim() && !imageBase64) {
      setStatus("보낼 내용을 적거나 사진을 골라주세요.");
      return;
    }
    setSending(true);
    setStatus("보내는 중이에요…");
    try {
      const res = await fetch("/api/family/post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senderAccessToken: token, text: message, imageBase64: imageBase64 ?? undefined }),
      });
      const j = await res.json().catch(() => null);
      if (res.ok && j?.ok) {
        setStatus("보냈어요! 😊");
        setMessage("");
        setImageBase64(null);
      } else {
        setStatus(j?.message ?? "보내지 못했어요. 다시 해주세요.");
      }
    } catch {
      setStatus("보내지 못했어요. 다시 해주세요.");
    } finally {
      setSending(false);
    }
  }

  const title = motherName ? `${motherName}님께 보내기` : "가족에게 보내기";

  return (
    <main className="mx-auto max-w-md px-5 py-8">
      <div className="flex items-center gap-2.5">
        <span
          aria-hidden="true"
          className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-300 to-amber-500 text-2xl shadow-soft"
        >
          💌
        </span>
        <div>
          <h1 className="text-2xl font-extrabold text-zinc-900">{title}</h1>
          <p className="text-base text-zinc-600">사진과 메시지를 보낼 수 있어요.</p>
        </div>
      </div>

      {/* 어머니가 올린 최근 사진 */}
      {photos.length > 0 && (
        <section className="mt-6 rounded-[1.75rem] bg-white p-5 shadow-soft">
          <h2 className="text-lg font-extrabold text-zinc-900">
            {motherName ? `${motherName}님의 최근 사진` : "최근 사진"}
          </h2>
          <div className="mt-3 grid grid-cols-3 gap-2.5">
            {photos.map((p) => (
              <div key={p.id} className="aspect-square overflow-hidden rounded-2xl bg-amber-100 ring-1 ring-black/5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.thumbUrl ?? p.url} alt={p.caption ?? "사진"} className="h-full w-full object-cover" />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 보내기 */}
      <section className="mt-5 rounded-[1.75rem] bg-white p-6 shadow-soft">
        <label htmlFor="family-message" className="block text-lg font-bold text-zinc-800">
          메시지
        </label>
        <textarea
          id="family-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="mt-2 w-full rounded-2xl border-2 border-amber-200 p-4 text-lg focus:border-amber-400 focus:ring-4 focus:ring-amber-300 focus:outline-none"
          rows={5}
          placeholder="예: 어머니 오늘 날씨 좋아요. 사진 보냈어요!"
          aria-label="보낼 메시지"
        />

        {/* 사진 첨부 */}
        {imageBase64 ? (
          <div className="mt-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageBase64} alt="보낼 사진 미리보기" className="max-h-56 w-full rounded-2xl object-cover" />
            <button
              type="button"
              onClick={() => setImageBase64(null)}
              className="mt-2 min-h-[44px] rounded-xl border-2 border-zinc-200 bg-white px-4 text-base font-semibold text-zinc-600 hover:bg-zinc-50"
            >
              사진 빼기
            </button>
          </div>
        ) : (
          <>
            <label
              htmlFor="family-photo"
              className="mt-3 flex min-h-[56px] cursor-pointer items-center justify-center rounded-2xl border-2 border-dashed border-amber-400 bg-amber-50 px-4 text-lg font-bold text-amber-800 hover:bg-amber-100"
            >
              📸 사진 첨부하기 (선택)
            </label>
            <input
              id="family-photo"
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={pickImage}
              className="sr-only"
            />
          </>
        )}

        <button
          onClick={send}
          disabled={sending}
          aria-label="보내기"
          className="mt-4 min-h-[56px] w-full rounded-2xl bg-amber-400 px-6 py-3 text-lg font-bold text-zinc-900 shadow-sm hover:bg-amber-300 focus:outline-none focus-visible:ring-4 focus-visible:ring-amber-300 disabled:opacity-60"
        >
          {sending ? "보내는 중…" : "보내기"}
        </button>
        {status && (
          <div role="status" aria-live="polite" className="mt-3 rounded-2xl bg-amber-50 px-4 py-3 text-center text-base text-amber-800">
            {status}
          </div>
        )}
      </section>
    </main>
  );
}
