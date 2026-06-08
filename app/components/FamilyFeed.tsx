"use client";

import React from "react";

type Item = { id: string; sender: string; text: string; imageUrl?: string; createdAt: string };

export default function FamilyFeed({ items }: { items: Item[] }) {
  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
      <h3 className="text-lg font-semibold">가족 피드</h3>
      <div className="mt-3 space-y-3">
        {items.map((it) => (
          <article key={it.id} className="flex items-start gap-3">
            <div className="h-14 w-14 flex-none overflow-hidden rounded-md bg-zinc-100">
              {it.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={it.imageUrl} alt={`${it.sender}님이 보낸 사진`} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-base text-zinc-500">사진</div>
              )}
            </div>
            <div>
              <div className="text-base font-medium">{it.sender}</div>
              <div className="text-base text-zinc-600">{it.text}</div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
