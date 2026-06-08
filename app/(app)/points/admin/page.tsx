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
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-semibold">환전 승인</h1>
      <div className="mt-4 space-y-3">
        {items.length === 0 && <div className="text-zinc-500">요청이 없습니다.</div>}
        {items.map(it => (
          <div key={it.id} className="rounded border bg-white p-3 flex items-center justify-between">
            <div>
              <div className="font-medium">{it.userName ?? it.userId ?? '사용자'}</div>
              <div className="text-sm text-zinc-600">{it.amount} 포인트 · 상태: {it.status}</div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => action(it.id, 'approve')} className="rounded bg-green-600 px-3 py-1 text-white">승인</button>
              <button onClick={() => action(it.id, 'complete')} className="rounded bg-indigo-600 px-3 py-1 text-white">완료</button>
              <button onClick={() => action(it.id, 'reject')} className="rounded bg-red-600 px-3 py-1 text-white">거절</button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
