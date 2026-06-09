"use client";

import React, { useMemo, useState } from "react";
import { ResultScreen } from "./WordMatchGame";
import { Difficulty } from "./difficulty";

// 순서 기억하기 (SEQUENCE_RECALL)
// 색 칸이 차례로 켜지면, 같은 순서로 눌러 따라합니다. 맞히면 한 칸씩 길어집니다.
// 점수 = 끝까지 따라한 단계 수. 목표 길이에 도달하면 완료.

const TILES = [
  { key: 0, name: "빨강", base: "bg-red-300", lit: "bg-red-500", ring: "focus-visible:ring-red-300" },
  { key: 1, name: "파랑", base: "bg-blue-300", lit: "bg-blue-500", ring: "focus-visible:ring-blue-300" },
  { key: 2, name: "초록", base: "bg-green-300", lit: "bg-green-500", ring: "focus-visible:ring-green-300" },
  { key: 3, name: "노랑", base: "bg-yellow-200", lit: "bg-yellow-400", ring: "focus-visible:ring-yellow-300" },
];

// 이 길이까지 따라하면 완료
const TARGET_BY_DIFFICULTY: Record<Difficulty, number> = { EASY: 5, MEDIUM: 7, HARD: 9 };
// 어려울수록 더 빨리 켜진다 (보여주는 시간, ms)
const LIT_MS: Record<Difficulty, number> = { EASY: 600, MEDIUM: 480, HARD: 360 };

type Phase = "ready" | "showing" | "input" | "over";
type SubmitState = {
  loading: boolean;
  points: number | null;
  error: string | null;
  dailyEarned?: number;
  dailyCap?: number;
  capReached?: boolean;
};

export default function SequenceRecallGame({ userId, difficulty = "EASY" }: { userId?: string; difficulty?: Difficulty }) {
  const TARGET = TARGET_BY_DIFFICULTY[difficulty];
  const litMs = LIT_MS[difficulty];
  const [sequence, setSequence] = useState<number[]>([]);
  const [phase, setPhase] = useState<Phase>("ready");
  const [active, setActive] = useState<number | null>(null);
  const [inputIndex, setInputIndex] = useState(0);
  const [startedAt, setStartedAt] = useState<number>(() => Date.now());
  const [finishedAt, setFinishedAt] = useState<number | null>(null);
  const [submit, setSubmit] = useState<SubmitState>({ loading: false, points: null, error: null });
  const [round, setRound] = useState(0);
  const [finalScore, setFinalScore] = useState(0);

  const done = phase === "over";
  const durationSec = useMemo(() => {
    const end = finishedAt ?? Date.now();
    return Math.max(1, Math.round((end - startedAt) / 1000));
  }, [finishedAt, startedAt]);

  async function postResult(score: number, end: number) {
    setSubmit({ loading: true, points: null, error: null });
    try {
      const res = await fetch("/api/games/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameType: "SEQUENCE_RECALL",
          difficulty,
          score,
          totalItems: TARGET,
          durationSec: Math.max(1, Math.round((end - startedAt) / 1000)),
          userId,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.ok)
        setSubmit({
          loading: false,
          points: json.pointsEarned ?? 0,
          error: null,
          dailyEarned: json.dailyEarned,
          dailyCap: json.dailyCap,
          capReached: json.capReached,
        });
      else setSubmit({ loading: false, points: null, error: json?.message ?? "다시 해주세요." });
    } catch {
      setSubmit({ loading: false, points: null, error: "점수를 저장하지 못했어요. 다시 해주세요." });
    }
  }

  function playSequence(seq: number[]) {
    setPhase("showing");
    setActive(null);
    let i = 0;
    const step = () => {
      if (i >= seq.length) {
        setPhase("input");
        setInputIndex(0);
        return;
      }
      setActive(seq[i]);
      window.setTimeout(() => {
        setActive(null);
        i += 1;
        window.setTimeout(step, Math.round(litMs * 0.5));
      }, litMs);
    };
    window.setTimeout(step, 450);
  }

  function startGame() {
    const first = [Math.floor(Math.random() * 4)];
    setSequence(first);
    setStartedAt(Date.now());
    setFinishedAt(null);
    setSubmit({ loading: false, points: null, error: null });
    setFinalScore(0);
    playSequence(first);
  }

  function nextRound(prev: number[]) {
    const grown = [...prev, Math.floor(Math.random() * 4)];
    setSequence(grown);
    window.setTimeout(() => playSequence(grown), 600);
  }

  function tap(tile: number) {
    if (phase !== "input") return;
    // 누른 칸 잠깐 켜기
    setActive(tile);
    window.setTimeout(() => setActive(null), 200);

    if (tile === sequence[inputIndex]) {
      const nextIndex = inputIndex + 1;
      if (nextIndex === sequence.length) {
        // 이번 단계 성공
        if (sequence.length >= TARGET) {
          const end = Date.now();
          setFinalScore(sequence.length);
          setFinishedAt(end);
          setPhase("over");
          void postResult(sequence.length, end);
        } else {
          setPhase("showing");
          nextRound(sequence);
        }
      } else {
        setInputIndex(nextIndex);
      }
    } else {
      // 틀림 — 직전까지 완료한 단계 수가 점수
      const score = Math.max(0, sequence.length - 1);
      const end = Date.now();
      setFinalScore(score);
      setFinishedAt(end);
      setPhase("over");
      void postResult(score, end);
    }
  }

  function restart() {
    setSequence([]);
    setPhase("ready");
    setActive(null);
    setInputIndex(0);
    setRound((r) => r + 1);
    setSubmit({ loading: false, points: null, error: null });
    setFinishedAt(null);
  }

  if (done) {
    return (
      <ResultScreen score={finalScore} total={TARGET} durationSec={durationSec} submit={submit} onRestart={restart} />
    );
  }

  const message =
    phase === "ready"
      ? "색이 켜지는 순서를 잘 보고, 똑같이 눌러주세요."
      : phase === "showing"
        ? "잘 보세요…"
        : "이제 같은 순서로 눌러주세요!";

  return (
    <div key={round} className="rounded-2xl border border-amber-100 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between text-lg font-semibold text-zinc-700">
        <span>단계 {sequence.length} / {TARGET}</span>
        <span aria-live="polite">{phase === "input" ? `${inputIndex} / ${sequence.length}` : ""}</span>
      </div>
      <p className="mt-3 min-h-[28px] text-center text-lg text-zinc-600" role="status" aria-live="polite">
        {message}
      </p>

      <div className="mx-auto mt-5 grid max-w-sm grid-cols-2 gap-3">
        {TILES.map((t) => {
          const isLit = active === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => tap(t.key)}
              disabled={phase !== "input"}
              aria-label={t.name}
              className={
                "flex aspect-square items-center justify-center rounded-3xl text-xl font-bold text-zinc-800/80 transition-all focus:outline-none focus-visible:ring-4 " +
                t.ring +
                " " +
                (isLit ? t.lit + " scale-95" : t.base) +
                (phase === "input" ? " hover:brightness-105" : " cursor-default")
              }
            >
              {t.name}
            </button>
          );
        })}
      </div>

      {phase === "ready" && (
        <button
          type="button"
          onClick={startGame}
          aria-label="순서 기억 게임 시작"
          className="mt-6 min-h-[64px] w-full rounded-2xl bg-amber-400 px-6 py-3 text-xl font-bold text-zinc-900 shadow-sm hover:bg-amber-300 focus:outline-none focus-visible:ring-4 focus-visible:ring-amber-300"
        >
          시작하기
        </button>
      )}
    </div>
  );
}
