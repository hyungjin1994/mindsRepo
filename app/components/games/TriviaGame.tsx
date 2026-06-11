"use client";

import React, { useMemo, useState } from "react";
import { ResultScreen } from "./WordMatchGame";
import { Difficulty, QUESTION_COUNT } from "./difficulty";

// 상식 퀴즈 (TRIVIA) — 수도·한국 상식·생활/자연 상식·속담. 4지선다.
// 난이도가 올라가면 문제 수가 늘어난다. 문제는 모두 코드 안에 있다(외부 데이터 없음).

type Seed = { q: string; a: string; others: [string, string, string] };

const SEEDS: Seed[] = [
  // 세계 수도
  { q: "일본의 수도는 어디일까요?", a: "도쿄", others: ["오사카", "베이징", "서울"] },
  { q: "중국의 수도는 어디일까요?", a: "베이징", others: ["상하이", "도쿄", "홍콩"] },
  { q: "프랑스의 수도는 어디일까요?", a: "파리", others: ["런던", "로마", "베를린"] },
  { q: "영국의 수도는 어디일까요?", a: "런던", others: ["파리", "더블린", "마드리드"] },
  { q: "미국의 수도는 어디일까요?", a: "워싱턴", others: ["뉴욕", "로스앤젤레스", "시카고"] },
  { q: "이탈리아의 수도는 어디일까요?", a: "로마", others: ["밀라노", "베네치아", "나폴리"] },
  { q: "독일의 수도는 어디일까요?", a: "베를린", others: ["뮌헨", "함부르크", "프랑크푸르트"] },
  { q: "러시아의 수도는 어디일까요?", a: "모스크바", others: ["상트페테르부르크", "베를린", "키예프"] },
  { q: "캐나다의 수도는 어디일까요?", a: "오타와", others: ["토론토", "밴쿠버", "몬트리올"] },
  { q: "호주의 수도는 어디일까요?", a: "캔버라", others: ["시드니", "멜버른", "브리즈번"] },
  { q: "스페인의 수도는 어디일까요?", a: "마드리드", others: ["바르셀로나", "리스본", "로마"] },
  { q: "태국의 수도는 어디일까요?", a: "방콕", others: ["푸켓", "치앙마이", "하노이"] },
  { q: "베트남의 수도는 어디일까요?", a: "하노이", others: ["호치민", "방콕", "다낭"] },
  { q: "이집트의 수도는 어디일까요?", a: "카이로", others: ["알렉산드리아", "두바이", "이스탄불"] },

  // 한국 상식
  { q: "한글을 만든 임금은 누구일까요?", a: "세종대왕", others: ["태조", "정조", "광개토대왕"] },
  { q: "거북선을 만든 장군은 누구일까요?", a: "이순신", others: ["강감찬", "을지문덕", "김유신"] },
  { q: "우리나라의 나라 꽃(국화)은 무엇일까요?", a: "무궁화", others: ["진달래", "개나리", "벚꽃"] },
  { q: "서울을 가로지르는 강의 이름은 무엇일까요?", a: "한강", others: ["낙동강", "금강", "영산강"] },
  { q: "제주도에 있는 산의 이름은 무엇일까요?", a: "한라산", others: ["설악산", "지리산", "북한산"] },
  { q: "우리나라에서 가장 큰 섬은 어디일까요?", a: "제주도", others: ["울릉도", "강화도", "거제도"] },
  { q: "설날에 먹는 대표 음식은 무엇일까요?", a: "떡국", others: ["송편", "팥죽", "비빔밥"] },
  { q: "추석에 먹는 대표 음식은 무엇일까요?", a: "송편", others: ["떡국", "부침개", "잡채"] },
  { q: "동지에 먹는 음식은 무엇일까요?", a: "팥죽", others: ["떡국", "송편", "미역국"] },
  { q: "생일에 끓여 먹는 국은 무엇일까요?", a: "미역국", others: ["떡국", "콩나물국", "된장국"] },
  { q: "우리나라의 화폐 단위는 무엇일까요?", a: "원", others: ["엔", "위안", "달러"] },
  { q: "조선을 세운 첫 번째 임금은 누구일까요?", a: "태조 이성계", others: ["세종", "정조", "영조"] },
  { q: "태극기 가운데 동그라미를 무엇이라 부를까요?", a: "태극", others: ["무궁화", "원", "해"] },

  // 생활·자연 상식
  { q: "물이 어는 온도는 몇 도일까요?", a: "0도", others: ["10도", "100도", "영하 10도"] },
  { q: "물이 끓는 온도는 몇 도일까요?", a: "100도", others: ["0도", "50도", "200도"] },
  { q: "무지개는 보통 몇 가지 색일까요?", a: "일곱 가지", others: ["다섯 가지", "세 가지", "열 가지"] },
  { q: "한 시간은 몇 분일까요?", a: "60분", others: ["30분", "100분", "90분"] },
  { q: "일 년은 며칠일까요?", a: "365일", others: ["360일", "300일", "400일"] },
  { q: "해는 어느 쪽에서 뜰까요?", a: "동쪽", others: ["서쪽", "남쪽", "북쪽"] },
  { q: "벌이 모으는 것은 무엇일까요?", a: "꿀", others: ["우유", "기름", "설탕"] },
  { q: "우유로 만드는 음식은 무엇일까요?", a: "치즈", others: ["두부", "김치", "빵"] },
  { q: "사람 몸에서 피를 펌프질하는 곳은 어디일까요?", a: "심장", others: ["폐", "간", "위"] },
  { q: "겨울잠을 자는 동물은 무엇일까요?", a: "곰", others: ["토끼", "호랑이", "사슴"] },
  { q: "달이 가장 둥글게 보이는 때는 언제일까요?", a: "보름", others: ["그믐", "초승", "반달"] },
  { q: "거미의 다리는 몇 개일까요?", a: "여덟 개", others: ["여섯 개", "네 개", "열 개"] },
  { q: "낮과 밤이 생기는 까닭은 지구가 무엇을 하기 때문일까요?", a: "자전(스스로 돎)", others: ["공전", "멈춤", "뒤로 돎"] },

  // 속담 완성
  { q: "가는 말이 고와야 오는 말이 ___.", a: "곱다", others: ["밉다", "많다", "빠르다"] },
  { q: "낮말은 새가 듣고 밤말은 ___가 듣는다.", a: "쥐", others: ["개", "소", "고양이"] },
  { q: "티끌 모아 ___.", a: "태산", others: ["모래", "바다", "언덕"] },
  { q: "원숭이도 나무에서 ___.", a: "떨어진다", others: ["잔다", "논다", "운다"] },
  { q: "발 없는 말이 ___ 간다.", a: "천 리", others: ["백 리", "십 리", "만 리"] },
  { q: "세 살 버릇 ___까지 간다.", a: "여든", others: ["백 살", "환갑", "마흔"] },
  { q: "등잔 밑이 ___.", a: "어둡다", others: ["밝다", "따뜻하다", "좁다"] },
  { q: "호랑이도 제 말 하면 ___.", a: "온다", others: ["간다", "운다", "잔다"] },
  { q: "백지장도 ___ 낫다.", a: "맞들면", others: ["혼자 들면", "접으면", "버리면"] },
  { q: "콩 심은 데 콩 나고 ___ 심은 데 ___ 난다.", a: "팥", others: ["쌀", "보리", "깨"] },
];

type Question = { prompt: string; answer: string; options: string[] };

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
    .map((s) => ({ prompt: s.q, answer: s.a, options: shuffle([s.a, ...s.others]) }));
}

type SubmitState = {
  loading: boolean;
  points: number | null;
  error: string | null;
  dailyEarned?: number;
  dailyCap?: number;
  capReached?: boolean;
};

export default function TriviaGame({ userId, difficulty = "EASY" }: { userId?: string; difficulty?: Difficulty }) {
  const TOTAL = QUESTION_COUNT[difficulty];
  const [questions, setQuestions] = useState<Question[]>(() => buildQuestions(TOTAL));
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
          gameType: "TRIVIA",
          difficulty,
          score: finalScore,
          totalItems: TOTAL,
          durationSec: Math.max(1, Math.round((end - startedAt) / 1000)),
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

    window.setTimeout(() => {
      if (index + 1 >= questions.length) {
        const end = Date.now();
        setFinishedAt(end);
        void postResult(nextScore, end);
      } else {
        setIndex((i) => i + 1);
        setPicked(null);
      }
    }, 1000);
  }

  function restart() {
    setQuestions(buildQuestions(TOTAL));
    setIndex(0);
    setScore(0);
    setPicked(null);
    setStartedAt(Date.now());
    setFinishedAt(null);
    setSubmit({ loading: false, points: null, error: null });
    setRound((r) => r + 1);
  }

  if (done) {
    return <ResultScreen score={score} total={TOTAL} durationSec={durationSec} submit={submit} onRestart={restart} />;
  }

  const correctPick = picked === current.answer;

  return (
    <div key={round} className="rounded-2xl border border-amber-100 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between text-lg font-semibold text-zinc-700">
        <span>문제</span>
        <span aria-label={`전체 ${questions.length}문제 중 ${index + 1}번째`}>
          {index + 1} / {questions.length}
        </span>
      </div>
      <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-zinc-200">
        <div
          className="h-full rounded-full bg-amber-400 transition-all"
          style={{ width: `${Math.round((index / questions.length) * 100)}%` }}
        />
      </div>

      <p className="mt-6 text-center text-2xl font-bold text-zinc-900">{current.prompt}</p>

      <div className="mt-7 grid gap-3">
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
                "min-h-[64px] w-full rounded-2xl border-2 px-5 py-3 text-xl font-semibold focus:outline-none focus-visible:ring-4 focus-visible:ring-amber-300 disabled:cursor-default " +
                (showCorrect
                  ? "border-green-600 bg-green-100 text-green-900"
                  : showWrong
                    ? "border-red-500 bg-red-100 text-red-900"
                    : "border-amber-200 bg-white text-zinc-900 hover:bg-amber-50")
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
          {correctPick ? "정답이에요!" : `아쉬워요 — 정답은 "${current.answer}"`}
        </p>
      )}
    </div>
  );
}
