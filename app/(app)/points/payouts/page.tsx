"use client";

import React, { useEffect, useState } from 'react';

export default function PayoutsPage() {
  const [points, setPoints] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    async function loadUser() {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const json = await res.json();
        setUserId(json.user?.id ?? null);
      }
    }
    loadUser();
  }, []);

  async function requestPayout() {
    if (!userId) return setStatus('로그인이 필요합니다.');
    setStatus('요청 중...');
    try {
      const res = await fetch('/api/payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, points: Number(points) }),
      });
      const j = await res.json();
      if (res.ok) setStatus('요청이 접수되었습니다.'); else setStatus(j?.message ?? '오류');
    } catch (e: any) {
      setStatus(String(e?.message ?? e));
    }
  }

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-semibold">환전 신청</h1>
      <p className="mt-2 text-sm text-zinc-600">포인트를 환전 신청합니다. 자식이 승인하면 처리됩니다.</p>

      <section className="mt-6">
        <div className="rounded border bg-white p-4">
          <input className="w-32 rounded border px-2 py-1" value={points} onChange={(e) => setPoints(e.target.value)} placeholder="포인트" />
          <div className="mt-3">
            <button onClick={requestPayout} className="rounded bg-blue-600 px-3 py-1 text-white">신청</button>
          </div>
          {status && <div className="mt-2 text-sm">{status}</div>}
        </div>
      </section>
    </main>
  );
}
