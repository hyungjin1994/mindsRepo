"use client";

import React, { useState } from "react";
import WordMatchGame from "../../components/games/WordMatchGame";
import NumberCalcGame from "../../components/games/NumberCalcGame";
import ColorNameGame from "../../components/games/ColorNameGame";
import MemoryMatchGame from "../../components/games/MemoryMatchGame";
import SequenceRecallGame from "../../components/games/SequenceRecallGame";
import { Difficulty, DIFFICULTIES } from "../../components/games/difficulty";

type GameKey = "WORD_MATCH" | "MEMORY_IMAGE" | "SEQUENCE_RECALL" | "NUMBER_CALC" | "COLOR_NAME";

type GameInfo = {
  key: GameKey;
  name: string;
  desc: string;
};

const GAMES: GameInfo[] = [
  { key: "MEMORY_IMAGE", name: "카드 짝맞추기", desc: "같은 그림 카드 짝을 찾아요" },
  { key: "WORD_MATCH", name: "단어 맞추기", desc: "낱말과 어울리는 짝을 골라요" },
  { key: "SEQUENCE_RECALL", name: "순서 기억", desc: "켜지는 순서를 똑같이 눌러요" },
  { key: "NUMBER_CALC", name: "숫자 계산", desc: "간단한 더하기 빼기를 풀어요" },
  { key: "COLOR_NAME", name: "색깔 맞추기", desc: "글자가 칠해진 색을 맞춰요" },
];

export default function GamesPage() {
  const [selected, setSelected] = useState<GameKey | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);

  const current = GAMES.find((g) => g.key === selected) ?? null;

  function pickGame(key: GameKey) {
    setSelected(key);
    setDifficulty(null);
  }
  function backToList() {
    setSelected(null);
    setDifficulty(null);
  }

  const GAME_ICONS: Record<GameKey, string> = {
    MEMORY_IMAGE: "🃏",
    WORD_MATCH: "🧩",
    SEQUENCE_RECALL: "🔆",
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
              onClick={() => pickGame(g.key)}
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
            onClick={backToList}
            aria-label="게임 목록으로 돌아가기"
            className="mb-4 inline-flex min-h-[56px] items-center rounded-2xl border-2 border-amber-200 bg-white px-5 py-3 text-lg font-semibold text-zinc-800 hover:bg-amber-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-amber-300"
          >
            ← 다른 게임 고르기
          </button>

          <h2 className="mb-4 text-2xl font-bold text-zinc-900">{current.name}</h2>

          {difficulty === null ? (
            <div>
              <p className="text-lg text-zinc-600">
                난이도를 골라주세요. 어려울수록 포인트를 더 많이 받아요!
              </p>
              <div className="mt-4 grid gap-3">
                {DIFFICULTIES.map((d) => (
                  <button
                    key={d.key}
                    type="button"
                    onClick={() => setDifficulty(d.key)}
                    aria-label={`${d.label} 난이도로 시작`}
                    className="flex min-h-[76px] w-full items-center gap-4 rounded-3xl border border-amber-100 bg-white px-5 py-3 text-left shadow-sm hover:bg-amber-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-amber-300"
                  >
                    <span className="flex-none rounded-2xl bg-amber-100 px-3 py-2 text-xl font-extrabold text-amber-800">
                      ×{d.mult}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-xl font-bold text-zinc-900">{d.label}</span>
                      <span className="block text-base text-zinc-600">{d.desc}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <button
                type="button"
                onClick={() => setDifficulty(null)}
                aria-label="난이도 다시 고르기"
                className="mb-4 inline-flex min-h-[44px] items-center rounded-xl border border-amber-200 bg-white px-4 py-2 text-base font-semibold text-amber-700 hover:bg-amber-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-amber-300"
              >
                난이도 바꾸기
              </button>
              {selected === "MEMORY_IMAGE" && <MemoryMatchGame difficulty={difficulty} />}
              {selected === "WORD_MATCH" && <WordMatchGame difficulty={difficulty} />}
              {selected === "SEQUENCE_RECALL" && <SequenceRecallGame difficulty={difficulty} />}
              {selected === "NUMBER_CALC" && <NumberCalcGame difficulty={difficulty} />}
              {selected === "COLOR_NAME" && <ColorNameGame difficulty={difficulty} />}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
