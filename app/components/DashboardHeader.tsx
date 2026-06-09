"use client";

import React from "react";

type Props = {
  name: string;
  points: number;
  onOpenHelp?: () => void;
};

export default function DashboardHeader({ name, points, onOpenHelp }: Props) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 sm:text-4xl">
          안녕하세요, {name}님 👋
        </h1>
        <p className="mt-1.5 text-lg text-zinc-600">오늘도 만나서 반가워요.</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex min-h-[56px] items-center gap-2 rounded-2xl bg-amber-400 px-5 py-3 text-lg font-bold text-zinc-900 shadow-sm">
          <span aria-hidden="true">⭐</span>
          <span>{points}점</span>
        </div>
        <button
          aria-label="도움말 열기"
          onClick={onOpenHelp}
          className="min-h-[56px] rounded-2xl border-2 border-amber-200 bg-white px-5 py-3 text-base font-semibold text-zinc-800 hover:bg-amber-50 focus:ring-4 focus:ring-amber-300 focus:outline-none"
        >
          도움말
        </button>
      </div>
    </header>
  );
}
