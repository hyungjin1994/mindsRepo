"use client";

import React, { useState } from "react";

export default function MagicLinkGenerator() {
  const [email, setEmail] = useState('');
  const [result, setResult] = useState<string | null>(null);

  async function generate() {
    setResult('링크를 만들고 있어요...');
    try {
      const res = await fetch('/api/family/magiclink', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
      const j = await res.json();
      if (res.ok) setResult(j.link ?? '링크를 만들었어요.'); else setResult(j?.message ?? '링크를 만들지 못했어요. 다시 해주세요.');
    } catch (e) {
      setResult('링크를 만들지 못했어요. 다시 해주세요.');
    }
  }

  return (
    <div className="rounded-lg border bg-white p-4">
      <h4 className="text-lg font-medium">가족 초대 링크</h4>
      <p className="text-base text-zinc-600">가족에게 보낼 매직링크를 이메일로 생성합니다.</p>
      <div className="mt-3 flex gap-2">
        <input
          type="email"
          aria-label="가족 이메일 주소"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="family@example.com"
          className="min-h-[56px] flex-1 rounded border px-4 py-3 text-base focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
        <button
          aria-label="초대 링크 생성"
          onClick={generate}
          className="min-h-[56px] rounded bg-blue-600 px-4 py-3 text-base text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
        >
          생성
        </button>
      </div>
      {result && <div className="mt-2 break-all text-base">{result}</div>}
    </div>
  );
}
