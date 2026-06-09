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

// 난이도별 포인트 배수 — 어려울수록 더 많은 포인트. 서버에서 권위 있게 계산한다.
const POINT_MULTIPLIER: Record<Difficulty, number> = { EASY: 1, MEDIUM: 2, HARD: 3 };

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

  // 기본 포인트 = 점수의 절반, 난이도 배수 적용 (쉬움 ×1 · 보통 ×2 · 어려움 ×3).
  const pts = Math.max(0, Math.floor((Number(score) / 2) * POINT_MULTIPLIER[difficulty]));

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

  return NextResponse.json({ ok: true, gamePlay: gp, pointsEarned: pts });
}
