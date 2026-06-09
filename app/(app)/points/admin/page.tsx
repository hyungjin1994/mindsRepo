"use client";

import React, { useEffect, useState } from 'react';

export default function PayoutsAdminPage() {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => { load(); }, []);
  async function load() {
    try {
      const res = await fetch('/api/payouts');
      const j = await res.json();
      setItems(j?.data ?? []);
    } catch (e) { setItems([]); }
  }

  async function action(id: string, act: 'approve' | 'reject' | 'complete') {
    try {
      if (act === 'approve') {
        const token = window.prompt('승인자 access token을 입력하세요 (family member accessToken)');
        if (!token) return;
        const approverName = window.prompt('승인자 이름 (선택)', '가족');
        await fetch('/api/payouts', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ payoutId: id, action: act, approverAccessToken: token, approverName }) });
      } else {
        await fetch('/api/payouts', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ payoutId: id, action: act }) });
      }
      load();
    } catch (e) {}
  }

  return (
    <div className="mx-auto max-w-2xl px-5 py-7">
      <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900">환전 승인</h1>
      <p className="mt-1.5 text-lg text-zinc-600">가족의 환전 요청을 승인·완료·거절해요.</p>
      <div className="mt-6 space-y-3">
        {items.length === 0 && (
          <div className="rounded-3xl border border-amber-100 bg-white p-8 text-center text-lg text-zinc-600 shadow-sm">
            요청이 없습니다.
          </div>
        )}
        {items.map(it => (
          <div key={it.id} className="rounded-2xl border border-amber-100 bg-white p-5 shadow-sm">
            <div className="text-xl font-bold text-zinc-900">{it.userName ?? it.userId ?? '사용자'}</div>
            <div className="mt-1 text-base text-zinc-600">{it.amount} 포인트 · 상태: {it.status}</div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button onClick={() => action(it.id, 'approve')} className="min-h-[48px] rounded-xl bg-green-600 px-5 py-2 text-base font-semibold text-white hover:bg-green-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-green-300">승인</button>
              <button onClick={() => action(it.id, 'complete')} className="min-h-[48px] rounded-xl bg-indigo-600 px-5 py-2 text-base font-semibold text-white hover:bg-indigo-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-300">완료</button>
              <button onClick={() => action(it.id, 'reject')} className="min-h-[48px] rounded-xl border-2 border-red-300 bg-white px-5 py-2 text-base font-semibold text-red-700 hover:bg-red-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-red-200">거절</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
