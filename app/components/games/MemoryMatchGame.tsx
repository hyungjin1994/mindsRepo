"use client";

import React, { useMemo, useState } from "react";
import { ResultScreen } from "./WordMatchGame";
import { Difficulty } from "./difficulty";

// 카드 짝맞추기 (MEMORY_IMAGE)
// 카드를 뒤집어 같은 그림 짝을 찾습니다. 노년 친화: 큰 그림, 큰 카드.
// 난이도가 올라가면 짝(카드)이 늘어납니다. 점수 = 맞춘 짝의 수.

const EMOJIS = ["🍎", "🐶", "🌻", "🚌", "🎵", "🍰", "🐱", "⛵", "🍇", "🌙", "🐰", "🎈"];
const PAIRS_BY_DIFFICULTY: Record<Difficulty, number> = { EASY: 6, MEDIUM: 8, HARD: 10 };

type Card = { id: number; emoji: string; matched: boolean };

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function buildDeck(pairs: number): Card[] {
  const picked = shuffle(EMOJIS).slice(0, pairs);
  const doubled = picked.flatMap((e) => [e, e]);
  return shuffle(doubled).map((emoji, id) => ({ id, emoji, matched: false }));
}

type SubmitState = { loading: boolean; points: number | null; error: string | null };

export default function MemoryMatchGame({ userId, difficulty = "EASY" }: { userId?: string; difficulty?: Difficulty }) {
  const PAIRS = PAIRS_BY_DIFFICULTY[difficulty];
  const gridCols = PAIRS <= 6 ? "grid-cols-3" : "grid-cols-4";
  const [deck, setDeck] = useState<Card[]>(() => buildDeck(PAIRS));
  const [flipped, setFlipped] = useState<number[]>([]); // 현재 뒤집힌(아직 안 맞춘) 카드 index
  const [lock, setLock] = useState(false); // 두 장 비교 중 잠금
  const [moves, setMoves] = useState(0);
  const [startedAt] = useState(() => Date.now());
  const [finishedAt, setFinishedAt] = useState<number | null>(null);
  const [submit, setSubmit] = useState<SubmitState>({ loading: false, points: null, error: null });
  const [round, setRound] = useState(0);

  const matchedCount = deck.filter((c) => c.matched).length / 2;
  const done = finishedAt !== null;

  const durationSec = useMemo(() => {
    const end = finishedAt ?? Date.now();
    return Math.max(1, Math.round((end - startedAt) / 1000));
  }, [finishedAt, startedAt]);

  async function postResult(end: number) {
    setSubmit({ loading: true, points: null, error: null });
    try {
      const res = await fetch("/api/games/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameType: "MEMORY_IMAGE",
          difficulty,
          score: PAIRS,
          totalItems: PAIRS,
          durationSec: Math.max(1, Math.round((end - startedAt) / 1000)),
          userId,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.ok) setSubmit({ loading: false, points: json.pointsEarned ?? 0, error: null });
      else setSubmit({ loading: false, points: null, error: json?.message ?? "다시 해주세요." });
    } catch {
      setSubmit({ loading: false, points: null, error: "점수를 저장하지 못했어요. 다시 해주세요." });
    }
  }

  function flip(i: number) {
    if (lock || done) return;
    if (deck[i].matched || flipped.includes(i)) return;

    const next = [...flipped, i];
    setFlipped(next);

    if (next.length === 2) {
      setMoves((m) => m + 1);
      const [a, b] = next;
      if (deck[a].emoji === deck[b].emoji) {
        // 짝 성공 — 바로 고정
        const newDeck = deck.map((c) => (c.id === a || c.id === b ? { ...c, matched: true } : c));
        setDeck(newDeck);
        setFlipped([]);
        if (newDeck.filter((c) => c.matched).length === PAIRS * 2) {
          const end = Date.now();
          setFinishedAt(end);
          void postResult(end);
        }
      } else {
        // 실패 — 잠깐 보여준 뒤 다시 뒤집기
        setLock(true);
        window.setTimeout(() => {
          setFlipped([]);
          setLock(false);
        }, 850);
      }
    }
  }

  function restart() {
    setDeck(buildDeck(PAIRS));
    setFlipped([]);
    setLock(false);
    setMoves(0);
    setFinishedAt(null);
    setSubmit({ loading: false, points: null, error: null });
    setRound((r) => r + 1);
  }

  if (done) {
    return (
      <ResultScreen score={PAIRS} total={PAIRS} durationSec={durationSec} submit={submit} onRestart={restart} />
    );
  }

  return (
    <div key={round} className="rounded-2xl border border-amber-100 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between text-lg font-semibold text-zinc-700">
        <span>맞춘 짝 {matchedCount} / {PAIRS}</span>
        <span>뒤집기 {moves}회</span>
      </div>
      <p className="mt-3 text-center text-lg text-zinc-600">카드를 눌러 같은 그림을 찾아보세요</p>

      <div className={"mt-5 grid gap-3 " + gridCols}>
        {deck.map((card, i) => {
          const isUp = card.matched || flipped.includes(i);
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => flip(i)}
              disabled={isUp || lock}
              aria-label={isUp ? `${card.emoji} 카드` : "뒤집힌 카드"}
              className={
                "flex aspect-square items-center justify-center rounded-2xl text-4xl transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-amber-300 " +
                (card.matched
                  ? "bg-green-100 ring-2 ring-green-400"
                  : isUp
                    ? "bg-white ring-2 ring-amber-300"
                    : "bg-amber-400 hover:bg-amber-300")
              }
            >
              <span aria-hidden="true">{isUp ? card.emoji : "❓"}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
