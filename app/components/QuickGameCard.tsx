"use client";

import React, { useState } from "react";
import Link from "next/link";
import WordMatchGame from "./games/WordMatchGame";

// 홈 화면의 "오늘의 게임" 카드.
// 예전에는 무작위 점수를 만들어 서버에 보냈지만(가짜 점수), 이제는 진짜 게임을 실행합니다.
// - "지금 풀기"를 누르면 단어 맞추기 한 판을 카드 안에서 바로 플레이합니다.
// - "다른 게임 보기"는 전체 게임 목록(/games)으로 이동합니다.

export default function QuickGameCard({ userId }: { userId?: string }) {
  const [playing, setPlaying] = useState(false);

  if (playing) {
    return (
      <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-zinc-900">단어 맞추기</h2>
          <button
            type="button"
            onClick={() => setPlaying(false)}
            aria-label="게임 닫기"
            className="min-h-[56px] rounded-xl border-2 border-zinc-300 bg-white px-4 py-3 text-base font-semibold text-zinc-800 hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-yellow-500"
          >
            닫기
          </button>
        </div>
        <WordMatchGame userId={userId} />
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <h2 className="text-2xl font-bold text-zinc-900">오늘의 게임</h2>
      <p className="mt-2 text-base text-zinc-600">
        추천: 단어 맞추기 — 부담 없이 잠깐만 풀어보세요.
      </p>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={() => setPlaying(true)}
          aria-label="단어 맞추기 지금 풀기"
          className="min-h-[56px] flex-1 rounded-xl bg-yellow-400 px-5 py-3 text-lg font-bold text-zinc-900 hover:bg-yellow-300 focus:outline-none focus:ring-2 focus:ring-yellow-600"
        >
          지금 풀기
        </button>
        <Link
          href="/games"
          aria-label="다른 게임 보기"
          className="flex min-h-[56px] flex-1 items-center justify-center rounded-xl border-2 border-zinc-300 bg-white px-5 py-3 text-lg font-semibold text-zinc-800 hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-yellow-500"
        >
          다른 게임 보기
        </Link>
      </div>
    </section>
  );
}
