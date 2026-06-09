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

  const GAME_ICONS: Record<GameKey, string> = {
    WORD_MATCH: "🧩",
    NUMBER_CALC: "🔢",
    COLOR_NAME: "🎨",
  };

  return (
    <div className="mx-auto max-w-2xl px-5 py-7">
      <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900">🎮 두뇌 게임</h1>
      <p className="mt-1.5 text-lg text-zinc-600">게임을 풀고 포인트를 모아보세요.</p>

      {current === null ? (
        <div className="mt-6 grid gap-4">
          {GAMES.map((g) => (
            <button
              key={g.key}
              type="button"
              onClick={() => setSelected(g.key)}
              aria-label={`${g.name} 시작하기`}
              className="flex min-h-[96px] w-full items-center gap-4 rounded-3xl border border-amber-100 bg-white px-5 py-4 text-left shadow-sm hover:bg-amber-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-amber-300"
            >
              <span
                aria-hidden="true"
                className="flex h-14 w-14 flex-none items-center justify-center rounded-2xl bg-amber-100 text-3xl"
              >
                {GAME_ICONS[g.key]}
              </span>
              <span className="min-w-0">
                <span className="block text-2xl font-bold text-zinc-900">{g.name}</span>
                <span className="mt-0.5 block text-lg text-zinc-600">{g.desc}</span>
              </span>
              <span aria-hidden="true" className="ml-auto text-2xl text-amber-400">
                ›
              </span>
            </button>
          ))}
        </div>
      ) : (
        <div className="mt-6">
          <button
            type="button"
            onClick={() => setSelected(null)}
            aria-label="게임 목록으로 돌아가기"
            className="mb-4 inline-flex min-h-[56px] items-center rounded-2xl border-2 border-amber-200 bg-white px-5 py-3 text-lg font-semibold text-zinc-800 hover:bg-amber-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-amber-300"
          >
            ← 다른 게임 고르기
          </button>

          <h2 className="mb-4 text-2xl font-bold text-zinc-900">{current.name}</h2>

          {selected === "WORD_MATCH" && <WordMatchGame />}
          {selected === "NUMBER_CALC" && <NumberCalcGame />}
          {selected === "COLOR_NAME" && <ColorNameGame />}
        </div>
      )}
    </div>
  );
}
