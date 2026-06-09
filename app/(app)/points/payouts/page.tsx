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
    <div className="mx-auto max-w-2xl px-5 py-7">
      <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900">💰 환전 신청</h1>
      <p className="mt-1.5 text-lg text-zinc-600">포인트를 환전 신청해요. 가족이 승인하면 처리됩니다.</p>

      <section className="mt-6 rounded-3xl border border-amber-100 bg-white p-6 shadow-sm">
        <label htmlFor="payout-points" className="text-lg font-semibold text-zinc-800">
          환전할 포인트
        </label>
        <input
          id="payout-points"
          type="number"
          className="mt-2 block w-full min-h-[56px] rounded-2xl border-2 border-amber-200 px-4 py-3 text-lg focus:border-amber-400 focus:ring-4 focus:ring-amber-300 focus:outline-none"
          value={points}
          onChange={(e) => setPoints(e.target.value)}
          placeholder="예) 1000"
        />
        <button
          onClick={requestPayout}
          className="mt-4 min-h-[56px] w-full rounded-2xl bg-amber-400 px-4 py-3 text-lg font-bold text-zinc-900 shadow-sm hover:bg-amber-300 focus:ring-4 focus:ring-amber-300 focus:outline-none"
        >
          환전 신청하기
        </button>
        {status && (
          <div
            role="status"
            aria-live="polite"
            className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-center text-base text-amber-800"
          >
            {status}
          </div>
        )}
      </section>
    </div>
  );
}
