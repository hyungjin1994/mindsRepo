"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

// 홈은 일부러 간결하게: 포인트 · 게임 득점 · 가족 사진 세 가지만 한눈에 보여준다.
// 자세한 기능은 하단 탭/더보기로.

const GAME_NAMES: Record<string, string> = {
  WORD_MATCH: "단어 맞추기",
  MEMORY_IMAGE: "카드 짝맞추기",
  NUMBER_CALC: "숫자 계산",
  COLOR_NAME: "색깔 맞추기",
  SEQUENCE_RECALL: "순서 기억",
};

type LastGame = { score: number; totalItems: number; gameType: string } | null;
type Photo = { id: string; imageUrl?: string | null; sender?: string };

export default function Home() {
  const [name, setName] = useState("어머니");
  const [points, setPoints] = useState<number>(124);
  const [lastGame, setLastGame] = useState<LastGame>({ score: 8, totalItems: 10, gameType: "WORD_MATCH" });
  // 데모용 placeholder 3칸 — 실제 사진이 오면 교체됨
  const [photos, setPhotos] = useState<Photo[]>([
    { id: "p1", sender: "아들" },
    { id: "p2", sender: "딸" },
    { id: "p3", sender: "손주" },
  ]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/dashboard");
        if (!res.ok) return;
        const j = await res.json();
        if (j.user) {
          setName(j.user.name ?? "어머니");
          setPoints(j.user.points ?? 0);
        }
        if ("lastGame" in j) setLastGame(j.lastGame);
        if (Array.isArray(j.familyFeed)) {
          const ph: Photo[] = j.familyFeed
            .filter((p: any) => p.imageUrl)
            .map((p: any) => ({ id: p.id, imageUrl: p.imageUrl, sender: p.sender?.name ?? "가족" }));
          setPhotos(ph);
        }
      } catch {
        // 로그아웃/오류 시 mock 유지
      }
    })();
  }, []);

  return (
    <div className="mx-auto max-w-2xl px-5 py-7">
      <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900">
        안녕하세요, {name}님 👋
      </h1>
      <p className="mt-1.5 text-lg text-zinc-600">오늘도 만나서 반가워요.</p>

      {/* 포인트 · 게임 득점 */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        <Link
          href="/points"
          aria-label="포인트 보기"
          className="rounded-3xl bg-amber-400 p-5 shadow-sm focus:outline-none focus-visible:ring-4 focus-visible:ring-amber-300"
        >
          <div className="text-3xl" aria-hidden="true">⭐</div>
          <div className="mt-2 text-base font-semibold text-amber-900">포인트</div>
          <div className="text-3xl font-extrabold text-zinc-900">
            {points.toLocaleString()}
            <span className="ml-1 text-xl font-bold">점</span>
          </div>
        </Link>

        <Link
          href="/games"
          aria-label="게임 하러 가기"
          className="rounded-3xl border border-amber-100 bg-white p-5 shadow-sm focus:outline-none focus-visible:ring-4 focus-visible:ring-amber-300"
        >
          <div className="text-3xl" aria-hidden="true">🎮</div>
          <div className="mt-2 text-base font-semibold text-zinc-700">게임 득점</div>
          {lastGame ? (
            <div className="text-zinc-900">
              <span className="text-3xl font-extrabold text-green-700">{lastGame.score}</span>
              <span className="text-xl font-bold">/{lastGame.totalItems}</span>
              <div className="mt-0.5 text-sm text-zinc-500">
                최근: {GAME_NAMES[lastGame.gameType] ?? "게임"}
              </div>
            </div>
          ) : (
            <div className="text-lg font-bold text-amber-700">첫 게임 시작하기 ›</div>
          )}
        </Link>
      </div>

      {/* 가족 사진 업데이트 */}
      <section className="mt-5 rounded-3xl border border-amber-100 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-zinc-900">📷 가족 사진</h2>
          <Link
            href="/family/feed"
            className="rounded-xl px-2 py-1 text-base font-semibold text-amber-700 hover:bg-amber-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-amber-300"
          >
            모두 보기 ›
          </Link>
        </div>

        {photos.length === 0 ? (
          <div className="mt-4 rounded-2xl bg-amber-50/70 px-4 py-6 text-center text-lg text-zinc-600">
            아직 새 사진이 없어요.
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-3 gap-3">
            {photos.slice(0, 6).map((p) => (
              <div
                key={p.id}
                className="aspect-square overflow-hidden rounded-2xl bg-amber-100"
                title={p.sender ? `${p.sender}님` : undefined}
              >
                {p.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.imageUrl}
                    alt={p.sender ? `${p.sender}님이 보낸 사진` : "가족 사진"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-3xl" aria-hidden="true">
                    🖼️
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
