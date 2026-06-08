"use client";

import React, { useState } from "react";
import WordMatchGame from "../../components/games/WordMatchGame";
import NumberCalcGame from "../../components/games/NumberCalcGame";
import ColorNameGame from "../../components/games/ColorNameGame";

type GameKey = "WORD_MATCH" | "NUMBER_CALC" | "COLOR_NAME";

type GameInfo = {
  key: GameKey;
  name: string;
  desc: string;
};

const GAMES: GameInfo[] = [
  { key: "WORD_MATCH", name: "단어 맞추기", desc: "낱말과 어울리는 짝을 골라요" },
  { key: "NUMBER_CALC", name: "숫자 계산", desc: "간단한 더하기 빼기를 풀어요" },
  { key: "COLOR_NAME", name: "색깔 맞추기", desc: "글자가 칠해진 색을 맞춰요" },
];

export default function GamesPage() {
  const [selected, setSelected] = useState<GameKey | null>(null);

  const current = GAMES.find((g) => g.key === selected) ?? null;

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-3xl font-bold text-zinc-900">두뇌 게임</h1>
      <p className="mt-2 text-lg text-zinc-600">게임을 풀고 포인트를 모아보세요.</p>

      {current === null ? (
        <div className="mt-6 grid gap-4">
          {GAMES.map((g) => (
            <button
              key={g.key}
              type="button"
              onClick={() => setSelected(g.key)}
              aria-label={`${g.name} 시작하기`}
              className="min-h-[96px] w-full rounded-2xl border-2 border-zinc-200 bg-white px-6 py-4 text-left shadow-sm hover:border-yellow-400 hover:bg-yellow-50 focus:outline-none focus:ring-2 focus:ring-yellow-500"
            >
              <span className="block text-2xl font-bold text-zinc-900">{g.name}</span>
              <span className="mt-1 block text-lg text-zinc-600">{g.desc}</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="mt-6">
          <button
            type="button"
            onClick={() => setSelected(null)}
            aria-label="게임 목록으로 돌아가기"
            className="mb-4 inline-flex min-h-[56px] items-center rounded-xl border-2 border-zinc-300 bg-white px-5 py-3 text-lg font-semibold text-zinc-800 hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-yellow-500"
          >
            ← 다른 게임 고르기
          </button>

          <h2 className="mb-4 text-2xl font-bold text-zinc-900">{current.name}</h2>

          {selected === "WORD_MATCH" && <WordMatchGame />}
          {selected === "NUMBER_CALC" && <NumberCalcGame />}
          {selected === "COLOR_NAME" && <ColorNameGame />}
        </div>
      )}
    </main>
  );
}
