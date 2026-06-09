"use client";

import React from "react";

type Item = { id: string; sender: string; text: string; imageUrl?: string; createdAt: string };

export default function FamilyFeed({ items }: { items: Item[] }) {
  return (
    <section className="rounded-3xl border border-amber-100 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-2">
        <span aria-hidden="true" className="text-2xl">💌</span>
        <h3 className="text-2xl font-bold text-zinc-900">가족 소식</h3>
      </div>
      {items.length === 0 ? (
        <div className="mt-3 rounded-2xl bg-amber-50/70 px-4 py-5 text-center text-lg text-zinc-600">
          아직 온 소식이 없어요.
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {items.map((it) => (
            <article key={it.id} className="flex items-start gap-3 rounded-2xl bg-amber-50/60 p-3">
              <div className="h-16 w-16 flex-none overflow-hidden rounded-2xl bg-amber-100">
                {it.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={it.imageUrl} alt={`${it.sender}님이 보낸 사진`} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-2xl" aria-hidden="true">🖼️</div>
                )}
              </div>
              <div className="min-w-0">
                <div className="text-lg font-bold text-zinc-900">{it.sender}</div>
                <div className="text-base text-zinc-600">{it.text}</div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
