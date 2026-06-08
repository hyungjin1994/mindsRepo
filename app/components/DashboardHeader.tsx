"use client";

import React from "react";

type Props = {
  name: string;
  points: number;
  onOpenHelp?: () => void;
};

export default function DashboardHeader({ name, points, onOpenHelp }: Props) {
  return (
    <header className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold">안녕하세요, {name}님</h1>
        <p className="mt-1 text-base text-zinc-600">오늘의 요약을 확인하세요</p>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex min-h-[56px] items-center rounded-md bg-yellow-100 px-4 py-3 text-base font-medium">포인트 {points}점</div>
        <button
          aria-label="도움말 열기"
          onClick={onOpenHelp}
          className="min-h-[56px] rounded-md bg-white px-4 py-3 text-base hover:bg-zinc-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
        >
          도움말
        </button>
      </div>
    </header>
  );
}
