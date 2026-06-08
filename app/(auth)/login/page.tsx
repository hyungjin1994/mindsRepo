"use client";

import { useState } from "react";
import { createClient } from "../../../lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setStatus("전송 중...");
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({ email });
      if (error) {
        setStatus("로그인 링크를 보내지 못했어요. 다시 해주세요.");
      } else {
        setStatus("링크를 이메일로 보냈습니다. 메일을 확인하세요.");
      }
    } catch (err) {
      setStatus("로그인 링크를 보내지 못했어요. 다시 해주세요.");
    }
  }

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="text-3xl font-semibold">로그인</h1>
      <p className="mt-2 text-base text-zinc-600">이메일로 매직링크를 보내 로그인하세요.</p>
      <form onSubmit={sendMagicLink} className="mt-4 flex flex-col gap-3">
        <input
          type="email"
          aria-label="이메일 주소"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="이메일 입력"
          required
          className="min-h-[56px] rounded border px-4 py-3 text-base focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
        <button className="min-h-[56px] rounded bg-blue-600 px-4 py-3 text-base text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:outline-none">
          전송
        </button>
      </form>
      {status && <p className="mt-3 text-base">{status}</p>}
    </main>
  );
}
