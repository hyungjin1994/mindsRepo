import { NextResponse } from "next/server";
import { GameType, Difficulty } from "@prisma/client";
import { prisma } from "../../../../lib/prisma";
import { getOrCreateUser } from "../../../../lib/auth";

const GAME_TYPES: GameType[] = [
  "WORD_MATCH",
  "MEMORY_IMAGE",
  "NUMBER_CALC",
  "COLOR_NAME",
  "SEQUENCE_RECALL",
];
const DIFFICULTIES: Difficulty[] = ["EASY", "MEDIUM", "HARD"];

// 하루에 모을 수 있는 게임 포인트 상한 (KST 자정 기준 리셋).
const DAILY_CAP = 1000;

// 한 판 "만점" 시 난이도별 최대 포인트. 난이도별 한 판 길이와 곱해 계산하면
// 쉼없이 플레이할 때 대략: 어려움 40분 · 보통 50분 · 쉬움 60분에 1000점에 도달.
// 실제 점수 비율(맞힌 비율)만큼 비례 지급하므로 잘 풀수록 빨리 채워진다.
const MAX_POINTS: Record<Difficulty, number> = { EASY: 17, MEDIUM: 30, HARD: 50 };

// KST(UTC+9) 기준 "오늘 00:00" 의 UTC 시각.
function startOfTodayKST(): Date {
  const nowMs = Date.now();
  const kst = new Date(nowMs + 9 * 3600 * 1000);
  const startUtcMs = Date.UTC(kst.getUTCFullYear(), kst.getUTCMonth(), kst.getUTCDate()) - 9 * 3600 * 1000;
  return new Date(startUtcMs);
}

function isGameType(v: unknown): v is GameType {
  return typeof v === "string" && (GAME_TYPES as string[]).includes(v);
}
function isDifficulty(v: unknown): v is Difficulty {
  return typeof v === "string" && (DIFFICULTIES as string[]).includes(v);
}

export async function POST(req: Request) {
  const mapped = await getOrCreateUser();
  let userId: string | null = null;
  if (mapped) userId = mapped.prismaUser.id;

  const body = await req.json().catch(() => ({}));

  // Dev fallback: when no authenticated mother is present (e.g. local testing
  // without login), allow the client to pass a userId in the body. The
  // authenticated user always takes precedence and is never overridden.
  userId = userId ?? body.userId ?? null;
  if (!userId) return NextResponse.json({ ok: false, message: "다시 해주세요." }, { status: 400 });

  const { gameType = "WORD_MATCH", difficulty = "EASY", score = 0, totalItems = 0, durationSec = 0 } = body;

  if (!isGameType(gameType)) {
    return NextResponse.json({ ok: false, message: "다시 해주세요." }, { status: 400 });
  }
  if (!isDifficulty(difficulty)) {
    return NextResponse.json({ ok: false, message: "다시 해주세요." }, { status: 400 });
  }

  // 점수 비율(맞힌 비율)만큼 난이도별 최대 포인트를 비례 지급.
  const total = Math.max(1, Number(totalItems));
  const ratio = Math.min(1, Math.max(0, Number(score) / total));
  const computed = Math.round(MAX_POINTS[difficulty] * ratio);

  // 오늘 이미 모은 게임 포인트를 합산해 하루 상한(1000)까지만 지급.
  const earnedAgg = await prisma.gamePlay.aggregate({
    where: { userId, playedAt: { gte: startOfTodayKST() } },
    _sum: { pointsEarned: true },
  });
  const earnedToday = earnedAgg._sum.pointsEarned ?? 0;
  const remaining = Math.max(0, DAILY_CAP - earnedToday);
  const pts = Math.min(computed, remaining);

  const gp = await prisma.gamePlay.create({
    data: {
      userId,
      gameType,
      difficulty,
      score: Number(score),
      totalItems: Number(totalItems),
      durationSec: Number(durationSec),
      pointsEarned: pts,
    },
  });

  // create point txn
  if (pts > 0) {
    await prisma.pointTransaction.create({
      data: {
        userId,
        kind: "EARN_GAME",
        amount: pts,
        reason: `Game ${gameType} score ${score}`,
        metadata: { gamePlayId: gp.id },
      },
    });

    await prisma.user.update({ where: { id: userId }, data: { points: { increment: pts } } });
  }

  const dailyEarned = earnedToday + pts;
  return NextResponse.json({
    ok: true,
    gamePlay: gp,
    pointsEarned: pts,
    dailyEarned,
    dailyCap: DAILY_CAP,
    capReached: dailyEarned >= DAILY_CAP,
  });
}
