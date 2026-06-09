"use client";

import React, { useMemo, useState } from "react";
import { ResultScreen } from "./WordMatchGame";
import { Difficulty, QUESTION_COUNT } from "./difficulty";

// 숫자 계산 (NUMBER_CALC)
// 간단한 더하기/빼기 문제를 풉니다. 4지선다.
// 난이도가 올라가면 수의 범위가 커집니다. 문제는 모두 코드 안에서 만들어집니다.

const MAX_BY_DIFFICULTY: Record<Difficulty, number> = { EASY: 20, MEDIUM: 50, HARD: 99 };

type Question = {
  a: number;
  b: number;
  op: "+" | "-";
  answer: number;
  options: number[];
};

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function makeQuestion(max: number): Question {
  const op: "+" | "-" = Math.random() < 0.5 ? "+" : "-";
  let a: number;
  let b: number;
  let answer: number;
  if (op === "+") {
    a = randInt(0, Math.floor(max * 0.6));
    b = randInt(0, max - a); // 합이 최대값을 넘지 않도록.
    answer = a + b;
  } else {
    a = randInt(Math.floor(max * 0.3), max);
    b = randInt(0, a); // 결과가 음수가 되지 않도록.
    answer = a - b;
  }

  // 정답 주변의 그럴듯한 오답 3개를 만든다 (중복/음수 제외).
  const spread = max > 50 ? 9 : 5;
  const wrongs = new Set<number>();
  while (wrongs.size < 3) {
    const delta = randInt(-spread, spread);
    const candidate = answer + delta;
    if (candidate >= 0 && candidate <= max && candidate !== answer) {
      wrongs.add(candidate);
    }
  }

  return {
    a,
    b,
    op,
    answer,
    options: shuffle([answer, ...Array.from(wrongs)]),
  };
}

function buildQuestions(total: number, max: number): Question[] {
  return Array.from({ length: total }, () => makeQuestion(max));
}

type SubmitState = {
  loading: boolean;
  points: number | null;
  error: string | null;
};

export default function NumberCalcGame({ userId, difficulty = "EASY" }: { userId?: string; difficulty?: Difficulty }) {
  const TOTAL = QUESTION_COUNT[difficulty];
  const MAX = MAX_BY_DIFFICULTY[difficulty];
  const [questions, setQuestions] = useState<Question[]>(() => buildQuestions(TOTAL, MAX));
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [startedAt, setStartedAt] = useState(() => Date.now());
  const [finishedAt, setFinishedAt] = useState<number | null>(null);
  const [submit, setSubmit] = useState<SubmitState>({ loading: false, points: null, error: null });
  const [round, setRound] = useState(0);

  const current = questions[index];
  const done = finishedAt !== null;

  const durationSec = useMemo(() => {
    const end = finishedAt ?? Date.now();
    return Math.max(1, Math.round((end - startedAt) / 1000));
  }, [finishedAt, startedAt]);

  async function postResult(finalScore: number, end: number) {
    setSubmit({ loading: true, points: null, error: null });
    try {
      const res = await fetch("/api/games/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameType: "NUMBER_CALC",
          difficulty,
          score: finalScore,
          totalItems: TOTAL,
          durationSec: Math.max(1, Math.round((end - startedAt) / 1000)),
          // 개발용 대비: 로그인 사용자가 없을 때만 서버가 이 값을 사용합니다.
          userId,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.ok) {
        setSubmit({ loading: false, points: json.pointsEarned ?? 0, error: null });
      } else {
        setSubmit({ loading: false, points: null, error: json?.message ?? "다시 해주세요." });
      }
    } catch {
      setSubmit({ loading: false, points: null, error: "점수를 저장하지 못했어요. 다시 해주세요." });
    }
  }

  function choose(option: number) {
    if (picked !== null || done) return;
    setPicked(option);
    const correct = option === current.answer;
    const nextScore = correct ? score + 1 : score;
    if (correct) setScore(nextScore);

    window.setTimeout(() => {
      if (index + 1 >= questions.length) {
        const end = Date.now();
        setFinishedAt(end);
        void postResult(nextScore, end);
      } else {
        setIndex((i) => i + 1);
        setPicked(null);
      }
    }, 900);
  }

  function restart() {
    setQuestions(buildQuestions(TOTAL, MAX));
    setIndex(0);
    setScore(0);
    setPicked(null);
    setStartedAt(Date.now());
    setFinishedAt(null);
    setSubmit({ loading: false, points: null, error: null });
    setRound((r) => r + 1);
  }

  if (done) {
    return (
      <ResultScreen
        score={score}
        total={TOTAL}
        durationSec={durationSec}
        submit={submit}
        onRestart={restart}
      />
    );
  }

  const correctPick = picked === current.answer;

  return (
    <div key={round} className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div>
        <div className="flex items-center justify-between text-lg font-semibold text-zinc-700">
          <span>문제</span>
          <span aria-label={`전체 ${questions.length}문제 중 ${index + 1}번째`}>
            {index + 1} / {questions.length}
          </span>
        </div>
        <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-zinc-200">
          <div
            className="h-full rounded-full bg-yellow-400 transition-all"
            style={{ width: `${Math.round((index / questions.length) * 100)}%` }}
          />
        </div>
      </div>

      <p className="mt-6 text-center text-xl text-zinc-700">계산해 보세요</p>
      <p className="mt-3 text-center text-5xl font-bold text-zinc-900" aria-label={`${current.a} ${current.op === "+" ? "더하기" : "빼기"} ${current.b}`}>
        {current.a} {current.op} {current.b} = ?
      </p>

      <div className="mt-8 grid grid-cols-2 gap-4">
        {current.options.map((opt) => {
          const isPicked = picked === opt;
          const isAnswer = opt === current.answer;
          const showCorrect = picked !== null && isAnswer;
          const showWrong = isPicked && !isAnswer;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => choose(opt)}
              disabled={picked !== null}
              aria-label={`답 ${opt}`}
              className={
                "min-h-[64px] w-full rounded-xl border-2 px-5 py-3 text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-yellow-500 disabled:cursor-default " +
                (showCorrect
                  ? "border-green-600 bg-green-100 text-green-900"
                  : showWrong
                    ? "border-red-500 bg-red-100 text-red-900"
                    : "border-zinc-300 bg-white text-zinc-900 hover:bg-yellow-50")
              }
            >
              {opt}
            </button>
          );
        })}
      </div>

      {picked !== null && (
        <p
          role="status"
          className={"mt-6 text-center text-2xl font-bold " + (correctPick ? "text-green-700" : "text-red-700")}
        >
          {correctPick ? "정답이에요!" : "다음엔 맞춰봐요!"}
        </p>
      )}
    </div>
  );
}
