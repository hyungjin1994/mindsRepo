import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { getOrCreateUser } from '../../../lib/auth';
import { sendMail } from '../../../lib/email';

// 도메인 검증 실패를 HTTP 상태로 옮기기 위한 작은 에러 타입.
// $transaction 안에서 throw 하면 트랜잭션이 통째로 롤백된다.
class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

// 환전(포인트→현금) API.
// - GET/POST 는 어머니 본인(로그인된 Supabase 계정)만 사용. userId 는 절대 클라이언트에서 받지 않는다.
// - PATCH(승인/거절/완료)는 자식의 매직링크 동작이 기본 — approverAccessToken 으로 FamilyMember 를 찾는다.
//   (approverAccessToken 이 없으면 로그인된 어머니 본인으로 폴백.)

export async function GET() {
  try {
    const mapped = await getOrCreateUser();
    if (!mapped) {
      return NextResponse.json({ ok: false, message: '로그인이 필요해요.' }, { status: 401 });
    }
    const userId = mapped.prismaUser.id;

    const requests = await prisma.pointPayoutRequest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return NextResponse.json({ ok: true, data: requests });
  } catch (err) {
    console.error('[payouts] GET failed:', err);
    return NextResponse.json({ ok: false, message: '환전 내역을 불러오지 못했어요. 다시 해주세요.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const mapped = await getOrCreateUser();
    if (!mapped) {
      return NextResponse.json({ ok: false, message: '로그인이 필요해요.' }, { status: 401 });
    }
    // 인증된 어머니 본인의 id 만 사용 — 클라이언트가 보낸 userId 는 신뢰하지 않는다.
    const userId = mapped.prismaUser.id;

    const body = await req.json().catch(() => ({}));
    const { note } = body;

    const points = Number(body.points);
    if (!Number.isInteger(points) || points <= 0) {
      return NextResponse.json({ ok: false, message: '환전할 포인트를 바르게 입력해주세요.' }, { status: 400 });
    }

    // 현재 잔액 확인 — 가진 포인트보다 많이 환전할 수 없다.
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ ok: false, message: '사용자를 찾을 수 없어요.' }, { status: 404 });
    }
    if (user.points < points) {
      return NextResponse.json({ ok: false, message: '포인트가 부족해요.' }, { status: 400 });
    }

    const cashAmount = Math.floor(points * 10);
    const pr = await prisma.pointPayoutRequest.create({
      data: { userId, points, cashAmount, note },
    });
    return NextResponse.json({ ok: true, payoutRequest: pr });
  } catch (err) {
    console.error('[payouts] POST failed:', err);
    return NextResponse.json({ ok: false, message: '환전 신청을 처리하지 못했어요. 다시 해주세요.' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { payoutId, action, approverName, approverAccessToken } = body;
    if (!payoutId || !action) {
      return NextResponse.json({ ok: false, message: '요청 정보가 부족해요. 다시 해주세요.' }, { status: 400 });
    }

    const pr = await prisma.pointPayoutRequest.findUnique({ where: { id: payoutId } });
    if (!pr) {
      return NextResponse.json({ ok: false, message: '환전 요청을 찾을 수 없어요.' }, { status: 404 });
    }

    // 권한 확인: 기본은 자식의 매직링크(approverAccessToken).
    // 토큰이 없으면 로그인된 어머니 본인으로 폴백 — 어느 쪽이든 이 환전의 주인이어야 한다.
    let familyMember: { name: string } | null = null;
    if (approverAccessToken) {
      const fm = await prisma.familyMember.findUnique({ where: { accessToken: approverAccessToken } });
      if (!fm || fm.userId !== pr.userId) {
        return NextResponse.json({ ok: false, message: '권한이 없어요.' }, { status: 403 });
      }
      familyMember = fm;
    } else {
      const mapped = await getOrCreateUser();
      if (!mapped || mapped.prismaUser.id !== pr.userId) {
        return NextResponse.json({ ok: false, message: '권한이 없어요.' }, { status: 403 });
      }
    }

    const approvedByName = familyMember?.name ?? approverName ?? null;

    if (action === 'approve') {
      // 승인: 상태 전이·잔액 차감·거래기록을 한 트랜잭션으로 원자 처리.
      // - updateMany({ where: { status: 'REQUESTED' } }) 의 count 로 동시 승인 경쟁을 차단.
      // - user.updateMany({ where: { points: { gte } } }) 의 count 로 오버드래프트를 차단.
      const updated = await prisma.$transaction(async (tx) => {
        const upd = await tx.pointPayoutRequest.updateMany({
          where: { id: payoutId, status: 'REQUESTED' },
          data: { status: 'APPROVED', approvedAt: new Date(), approvedByName },
        });
        if (upd.count === 0) {
          throw new HttpError(409, '이미 처리된 요청이에요.');
        }

        const dec = await tx.user.updateMany({
          where: { id: pr.userId, points: { gte: pr.points } },
          data: { points: { decrement: pr.points } },
        });
        if (dec.count === 0) {
          // 잔액 부족 — throw 로 위 상태 변경까지 롤백.
          throw new HttpError(400, '포인트가 부족해요.');
        }

        await tx.pointTransaction.create({
          data: {
            userId: pr.userId,
            kind: 'PAYOUT',
            amount: -Math.abs(pr.points),
            reason: `환전 승인 (${pr.points} 포인트)`,
            metadata: { payoutRequestId: pr.id },
          },
        });

        return tx.pointPayoutRequest.findUnique({ where: { id: payoutId } });
      });

      // 이메일은 트랜잭션 커밋 후 best-effort 로 발송 (실패해도 환전은 유효).
      try {
        const user = await prisma.user.findUnique({ where: { id: pr.userId } });
        if (user?.email) {
          await sendMail(
            user.email,
            '환전 신청이 승인되었습니다',
            `안녕하세요 ${user.name ?? ''}님,\n\n회원님의 환전 요청(${pr.points} 포인트, ${pr.cashAmount}원)이 ${approvedByName ?? '가족'}에 의해 승인되었습니다.`,
          );
        }
      } catch (e) {
        console.warn('failed to send payout email', e);
      }

      return NextResponse.json({ ok: true, updated });
    }

    if (action === 'reject') {
      // 거절: 이미 승인되어 차감된 건이면 같은 트랜잭션 안에서 환불까지 처리.
      const updated = await prisma.$transaction(async (tx) => {
        const current = await tx.pointPayoutRequest.findUnique({ where: { id: payoutId } });
        if (!current || (current.status !== 'REQUESTED' && current.status !== 'APPROVED')) {
          throw new HttpError(400, '이미 처리된 요청이에요.');
        }
        const wasApproved = current.status === 'APPROVED';

        // 읽은 상태가 그대로일 때만 거절 — 그 사이 바뀌었으면 count 0 으로 롤백.
        const upd = await tx.pointPayoutRequest.updateMany({
          where: { id: payoutId, status: current.status },
          data: { status: 'REJECTED' },
        });
        if (upd.count === 0) {
          throw new HttpError(409, '이미 처리된 요청이에요.');
        }

        if (wasApproved) {
          await tx.pointTransaction.create({
            data: {
              userId: current.userId,
              kind: 'PAYOUT',
              amount: Math.abs(current.points),
              reason: '거절로 환불',
              metadata: { payoutRequestId: current.id, reversal: true },
            },
          });
          await tx.user.update({
            where: { id: current.userId },
            data: { points: { increment: current.points } },
          });
        }

        return tx.pointPayoutRequest.findUnique({ where: { id: payoutId } });
      });

      return NextResponse.json({ ok: true, updated });
    }

    if (action === 'complete') {
      // 완료: APPROVED → COMPLETED 만 허용 (송금 완료 후). count 가드로 경쟁 차단.
      const upd = await prisma.pointPayoutRequest.updateMany({
        where: { id: payoutId, status: 'APPROVED' },
        data: { status: 'COMPLETED', completedAt: new Date() },
      });
      if (upd.count === 0) {
        return NextResponse.json({ ok: false, message: '승인된 요청만 완료할 수 있어요.' }, { status: 400 });
      }
      const updated = await prisma.pointPayoutRequest.findUnique({ where: { id: payoutId } });
      try {
        const user = await prisma.user.findUnique({ where: { id: pr.userId } });
        if (user?.email && updated) {
          await sendMail(
            user.email,
            '환전 처리 완료',
            `안녕하세요 ${user.name ?? ''}님,\n\n회원님의 환전 요청(${updated.points} 포인트, ${updated.cashAmount}원)이 송금 완료되어 상태가 "완료" 로 변경되었습니다.`,
          );
        }
      } catch (e) {
        console.warn('failed to send payout-complete email', e);
      }

      return NextResponse.json({ ok: true, updated });
    }

    return NextResponse.json({ ok: false, message: '알 수 없는 요청이에요.' }, { status: 400 });
  } catch (err) {
    if (err instanceof HttpError) {
      return NextResponse.json({ ok: false, message: err.message }, { status: err.status });
    }
    console.error('[payouts] PATCH failed:', err);
    return NextResponse.json({ ok: false, message: '환전 처리를 완료하지 못했어요. 다시 해주세요.' }, { status: 500 });
  }
}
