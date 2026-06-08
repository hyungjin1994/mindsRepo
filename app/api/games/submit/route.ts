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

  const gp = await prisma.gamePlay.create({
    data: {
      userId,
      gameType,
      difficulty,
      score: Number(score),
      totalItems: Number(totalItems),
      durationSec: Number(durationSec),
      pointsEarned: Math.max(0, Math.floor(Number(score) / 2)),
    },
  });

  // create point txn
  const pts = Math.max(0, Math.floor(Number(score) / 2));
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
