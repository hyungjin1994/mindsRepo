"use client";

import React, { useEffect, useState } from "react";

export default function PointsPage() {
  const [points, setPoints] = useState<number | null>(null);
  const [amount, setAmount] = useState(100);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/dashboard');
        const j = await res.json();
        setPoints(j?.points ?? 0);
      } catch (e) {
        setPoints(0);
      }
    }
    load();
  }, []);

  async function requestPayout(e: React.FormEvent) {
    e.preventDefault();
    setStatus("요청 중...");
    try {
      const me = await fetch('/api/auth/me');
      const mj = await me.json().catch(() => ({}));
      const userId = mj?.user?.id;
      if (!userId) return setStatus('로그인이 필요합니다.');

      const res = await fetch("/api/payouts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, points: amount, note: "앱에서 환전 요청" }) });
      const j = await res.json();
      if (res.ok) setStatus("환전 요청이 접수되었습니다.");
      else setStatus(`오류: ${j?.message ?? res.status}`);
    } catch (e) {
      setStatus("오류가 발생했습니다.");
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-5 py-7">
      <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900">포인트</h1>
      <p className="mt-1.5 text-lg text-zinc-600">게임과 활동으로 모은 포인트예요.</p>

      {/* 보유 포인트 — 크게, 한눈에 */}
      <div className="mt-6 flex items-center gap-4 rounded-3xl bg-amber-400 px-6 py-7 shadow-sm">
        <span aria-hidden="true" className="text-5xl">⭐</span>
        <div>
          <div className="text-base font-semibold text-amber-900">보유 포인트</div>
          <div className="text-4xl font-extrabold text-zinc-900">
            {points === null ? "…" : points.toLocaleString()}
            <span className="ml-1 text-2xl font-bold">점</span>
          </div>
        </div>
      </div>

      <section className="mt-5 rounded-3xl border border-amber-100 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-zinc-900">💰 환전 신청</h2>
        <p className="mt-1.5 text-base text-zinc-600">
          모은 포인트를 자녀에게 환전 요청할 수 있어요. (실제 송금은 가족이 직접 해요.)
        </p>
        <form onSubmit={requestPayout} className="mt-5 flex flex-col gap-3">
          <label htmlFor="payout-amount" className="text-lg font-semibold text-zinc-800">
            환전할 포인트
          </label>
          <input
            id="payout-amount"
            type="number"
            min={0}
            step={100}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            aria-label="환전할 포인트"
            className="min-h-[56px] rounded-2xl border-2 border-amber-200 px-4 py-3 text-lg focus:border-amber-400 focus:ring-4 focus:ring-amber-300 focus:outline-none"
          />
          <button className="min-h-[56px] rounded-2xl bg-amber-400 px-4 py-3 text-lg font-bold text-zinc-900 shadow-sm hover:bg-amber-300 focus:ring-4 focus:ring-amber-300 focus:outline-none">
            환전 신청하기
          </button>
        </form>
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
