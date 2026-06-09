"use client";

import React, { useMemo, useState } from "react";
import { Difficulty, QUESTION_COUNT } from "./difficulty";

// 단어 맞추기 (WORD_MATCH)
// 제시된 단어와 어울리는 짝(비슷한 말 또는 같은 종류)을 4개 보기 중에서 고릅니다.
// 문제는 모두 코드 안에서 만들어집니다 (외부 데이터 없음).

type QuestionSeed = {
  word: string; // 제시 단어
  answer: string; // 정답 보기
  others: string[]; // 오답 후보 (정답과 함께 섞어서 4지선다 구성)
};

const SEEDS: QuestionSeed[] = [
  { word: "사과", answer: "과일", others: ["채소", "생선", "음료"] },
  { word: "강아지", answer: "동물", others: ["나무", "가구", "옷"] },
  { word: "기쁘다", answer: "즐겁다", others: ["슬프다", "춥다", "배고프다"] },
  { word: "버스", answer: "교통수단", others: ["과일", "꽃", "신발"] },
  { word: "장미", answer: "꽃", others: ["곤충", "그릇", "신문"] },
  { word: "크다", answer: "거대하다", others: ["작다", "빠르다", "조용하다"] },
  { word: "겨울", answer: "계절", others: ["요일", "숫자", "색깔"] },
  { word: "의사", answer: "직업", others: ["과일", "도시", "악기"] },
  { word: "빠르다", answer: "신속하다", others: ["느리다", "무겁다", "달다"] },
  { word: "피아노", answer: "악기", others: ["가방", "우산", "냄비"] },
  { word: "바다", answer: "자연", others: ["연필", "텔레비전", "단추"] },
  { word: "어렵다", answer: "힘들다", others: ["쉽다", "맑다", "시원하다"] },
  { word: "고양이", answer: "동물", others: ["책상", "전화", "양말"] },
  { word: "비행기", answer: "교통수단", others: ["사탕", "거울", "장갑"] },
  { word: "포도", answer: "과일", others: ["벽돌", "리본", "양배추"] },
  { word: "기타", answer: "악기", others: ["수건", "접시", "지갑"] },
  { word: "여름", answer: "계절", others: ["월요일", "동전", "초록색"] },
  { word: "선생님", answer: "직업", others: ["바나나", "마을", "북"] },
];

type Question = {
  prompt: string;
  options: string[];
  answer: string;
};

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function buildQuestions(total: number): Question[] {
  return shuffle(SEEDS)
    .slice(0, total)
    .map((seed) => ({
      prompt: seed.word,
      answer: seed.answer,
      options: shuffle([seed.answer, ...seed.others.slice(0, 3)]),
    }));
}

type SubmitState = {
  loading: boolean;
  points: number | null;
  error: string | null;
  dailyEarned?: number;
  dailyCap?: number;
  capReached?: boolean;
};

export default function WordMatchGame({ userId, difficulty = "EASY" }: { userId?: string; difficulty?: Difficulty }) {
  const TOTAL = QUESTION_COUNT[difficulty];
  const [questions, setQuestions] = useState<Question[]>(() => buildQuestions(TOTAL));
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [startedAt] = useState(() => Date.now());
  const [finishedAt, setFinishedAt] = useState<number | null>(null);
  const [submit, setSubmit] = useState<SubmitState>({ loading: false, points: null, error: null });

  // 게임 한 판마다 시작 시각을 다시 기억해야 하므로 ref 대신 state 키로 관리.
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
          gameType: "WORD_MATCH",
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
        setSubmit({
          loading: false,
          points: json.pointsEarned ?? 0,
          error: null,
          dailyEarned: json.dailyEarned,
          dailyCap: json.dailyCap,
          capReached: json.capReached,
        });
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
    const correct = option === current.answer;
    const nextScore = correct ? score + 1 : score;
    if (correct) setScore(nextScore);

    // 잠깐 정답/오답을 보여준 뒤 다음 문제로.
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
    setQuestions(buildQuestions(TOTAL));
    setIndex(0);
    setScore(0);
    setPicked(null);
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

  return (
    <div key={round} className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <ProgressBar index={index} total={questions.length} />

      <p className="mt-6 text-center text-xl text-zinc-700">이 낱말과 어울리는 것을 골라주세요</p>
      <p className="mt-3 text-center text-5xl font-bold text-zinc-900">{current.prompt}</p>

      <div className="mt-8 grid gap-4">
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
              aria-label={`보기 ${opt}`}
              className={
                "min-h-[64px] w-full rounded-xl border-2 px-5 py-3 text-xl font-semibold focus:outline-none focus:ring-2 focus:ring-yellow-500 disabled:cursor-default " +
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

      <Feedback picked={picked} correct={picked === current.answer} />
    </div>
  );
}

function ProgressBar({ index, total }: { index: number; total: number }) {
  const pct = Math.round((index / total) * 100);
  return (
    <div>
      <div className="flex items-center justify-between text-lg font-semibold text-zinc-700">
        <span>문제</span>
        <span aria-label={`전체 ${total}문제 중 ${index + 1}번째`}>
          {index + 1} / {total}
        </span>
      </div>
      <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-zinc-200">
        <div className="h-full rounded-full bg-yellow-400 transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function Feedback({ picked, correct }: { picked: string | null; correct: boolean }) {
  if (picked === null) return null;
  return (
    <p
      role="status"
      className={"mt-6 text-center text-2xl font-bold " + (correct ? "text-green-700" : "text-red-700")}
    >
      {correct ? "정답이에요!" : "다음엔 맞춰봐요!"}
    </p>
  );
}

export function ResultScreen({
  score,
  total,
  durationSec,
  submit,
  onRestart,
}: {
  score: number;
  total: number;
  durationSec: number;
  submit: SubmitState;
  onRestart: () => void;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
      <p className="text-3xl font-bold text-zinc-900">참 잘하셨어요!</p>
      <p className="mt-4 text-2xl text-zinc-800">
        {total}문제 중 <span className="font-bold text-green-700">{score}개</span> 맞혔어요
      </p>
      <p className="mt-2 text-lg text-zinc-600">걸린 시간 {durationSec}초</p>

      <div className="mt-6 min-h-[48px]" role="status">
        {submit.loading && <span className="text-2xl font-bold text-zinc-600">점수를 저장하는 중이에요…</span>}
        {!submit.loading && submit.points !== null && (
          <div>
            <div className="text-2xl font-bold text-amber-700">+{submit.points} 포인트</div>
            {typeof submit.dailyEarned === "number" && submit.dailyCap ? (
              <div className="mt-1 text-base text-zinc-600">
                오늘 모은 점수 {submit.dailyEarned} / {submit.dailyCap}점
              </div>
            ) : null}
            {submit.capReached && (
              <div className="mt-1 text-base font-semibold text-green-700">
                오늘 포인트를 다 모았어요! 내일 또 만나요 😊
              </div>
            )}
          </div>
        )}
        {submit.error && <span className="text-2xl font-bold text-red-700">{submit.error}</span>}
      </div>

      <button
        type="button"
        onClick={onRestart}
        aria-label="다시 하기"
        className="mt-8 min-h-[64px] w-full rounded-xl bg-yellow-400 px-6 py-3 text-xl font-bold text-zinc-900 hover:bg-yellow-300 focus:outline-none focus:ring-2 focus:ring-yellow-600"
      >
        다시 하기
      </button>
    </div>
  );
}
