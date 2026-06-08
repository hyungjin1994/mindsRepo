import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { sendMail } from '../../../../lib/email';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ message: 'email required' }, { status: 400 });

    const token = crypto.randomBytes(20).toString('hex');
    const link = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/family/${token}`;

    // try to persist token in DB if available
    try {
      const { prisma } = await import('../../../../lib/prisma');
      await prisma.magicLink.create({ data: { token, email, expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24) } });
    } catch (e) {
      // fallback: no DB, still return link
    }

    // try sending email if SMTP configured
    try {
      await sendMail(
        email,
        'minds 가족 초대',
        `매직링크: ${link}`,
        `<p>매직링크: <a href="${link}">${link}</a></p>`,
      );
    } catch (e) {
      // ignore email send failures for now
    }

    return NextResponse.json({ link });
  } catch (err: any) {
    return NextResponse.json({ message: String(err?.message ?? err) }, { status: 500 });
  }
}
