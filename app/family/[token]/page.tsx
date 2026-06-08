"use client";

import React, { useState } from 'react';

// Next.js 16: route params are now a Promise. Since this is a client component,
// we unwrap it with React.use(params).
export default function FamilySendPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = React.use(params);
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  async function send() {
    if (!message.trim()) {
      setStatus('보낼 내용을 적어주세요.');
      return;
    }
    setSending(true);
    setStatus('보내는 중이에요...');
    try {
      // The API derives the recipient (mother) from the token, so we send the
      // child's accessToken as senderAccessToken and the message as text.
      const res = await fetch('/api/family/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senderAccessToken: token, text: message }),
      });
      const j = await res.json().catch(() => null);
      if (res.ok) {
        setStatus('보냈어요!');
        setMessage('');
      } else {
        setStatus(j?.message ?? '보내지 못했어요. 다시 해주세요.');
      }
    } catch {
      setStatus('보내지 못했어요. 다시 해주세요.');
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-3xl font-semibold">가족에게 보내기</h1>
      <p className="mt-2 text-base text-zinc-600">사진이나 메시지를 보낼 수 있어요.</p>

      <div className="mt-6 rounded border bg-white p-4">
        <label htmlFor="family-message" className="block text-lg font-medium text-zinc-800">
          메시지
        </label>
        <textarea
          id="family-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="mt-2 w-full rounded border p-4 text-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          rows={8}
          placeholder="메시지를 입력하세요"
          aria-label="보낼 메시지"
        />
        <div className="mt-4 flex gap-2">
          <button
            onClick={send}
            disabled={sending}
            aria-label="메시지 보내기"
            className="min-h-[56px] rounded bg-blue-600 px-6 py-3 text-lg font-semibold text-white focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-60"
          >
            보내기
          </button>
        </div>
        {status && (
          <div className="mt-3 text-base text-zinc-800" role="status" aria-live="polite">
            {status}
          </div>
        )}
      </div>
    </main>
  );
}
