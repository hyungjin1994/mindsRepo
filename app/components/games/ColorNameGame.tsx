"use client";

import React, { useMemo, useState } from "react";
import { ResultScreen } from "./WordMatchGame";

// 색깔 맞추기 (COLOR_NAME) — 스트룹 과제.
// 색깔 이름이 적힌 글자를 보여주는데, 글자의 "색"과 적힌 "이름"이 다를 수 있습니다.
// 사용자는 글자가 칠해진 "색"을 골라야 합니다.
// 문제는 모두 코드 안에서 만들어집니다 (외부 데이터 없음).

type ColorDef = {
  name: string; // 한글 색 이름
  className: string; // 글자에 적용할 Tailwind text 색상
};

const COLORS: ColorDef[] = [
  { name: "빨강", className: "text-red-600" },
  { name: "파랑", className: "text-blue-600" },
  { name: "초록", className: "text-green-600" },
  { name: "노랑", className: "text-yellow-500" },
  { name: "보라", className: "text-purple-600" },
  { name: "주황", className: "text-orange-500" },
];

type Question = {
  label: string; // 화면에 보이는 글자(색 이름)
  inkClass: string; // 글자가 칠해진 색의 클래스
  inkName: string; // 정답: 글자가 칠해진 색 이름
  options: string[]; // 보기(색 이름) 4개
};

const TOTAL = 10;

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function makeQuestion(): Question {
  const shuffled = shuffle(COLORS);
  const ink = shuffled[0]; // 글자가 실제로 칠해질 색 (정답)
  // 적힌 글자(이름)는 잉크 색과 다를 수도, 같을 수도 있게 무작위로 고른다.
  const label = COLORS[Math.floor(Math.random() * COLORS.length)];

  // 보기: 정답(잉크색) + 다른 색 3개.
  const distractors = shuffled.filter((c) => c.name !== ink.name).slice(0, 3);
  const options = shuffle([ink, ...distractors]).map((c) => c.name);

  return {
    label: label.name,
    inkClass: ink.className,
    inkName: ink.name,
    options,
  };
}

function buildQuestions(): Question[] {
  return Array.from({ length: TOTAL }, () => makeQuestion());
}

type SubmitState = {
  loading: boolean;
  points: number | null;
  error: string | null;
};

export default function ColorNameGame({ userId }: { userId?: string }) {
  const [questions, setQuestions] = useState<Question[]>(() => buildQuestions());
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
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
          gameType: "COLOR_NAME",
          difficulty: "EASY",
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

  function choose(option: string) {
    if (picked !== null || done) return;
    setPicked(option);
    const correct = option === current.inkName;
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
    setQuestions(buildQuestions());
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

  const correctPick = picked === current.inkName;

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

      <p className="mt-6 text-center text-xl text-zinc-700">글자가 칠해진 색을 골라주세요</p>
      <p
        className={"mt-4 text-center text-6xl font-extrabold " + current.inkClass}
        aria-label="아래 글자가 어떤 색으로 칠해져 있는지 맞춰보세요"
      >
        {current.label}
      </p>

      <div className="mt-8 grid grid-cols-2 gap-4">
        {current.options.map((opt) => {
          const isPicked = picked === opt;
          const isAnswer = opt === current.inkName;
          const showCorrect = picked !== null && isAnswer;
          const showWrong = isPicked && !isAnswer;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => choose(opt)}
              disabled={picked !== null}
              aria-label={`색깔 ${opt}`}
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
