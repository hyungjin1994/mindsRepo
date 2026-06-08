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
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-semibold">포인트</h1>
      <p className="mt-2 text-sm text-zinc-600">보유 포인트: {points}점</p>

      <section className="mt-6 rounded-lg border p-4 bg-white">
        <h3 className="font-medium">환전 신청</h3>
        <form onSubmit={requestPayout} className="mt-3 flex items-center gap-2">
          <input type="number" value={amount} onChange={(e)=>setAmount(Number(e.target.value))} className="rounded border px-2 py-1" />
          <button className="rounded bg-blue-600 px-3 py-1 text-white">신청</button>
        </form>
        {status && <div className="mt-2 text-sm">{status}</div>}
      </section>
    </main>
  );
}
