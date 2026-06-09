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
    <main className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-5 py-10">
      <div className="rounded-3xl border border-amber-100 bg-white p-7 shadow-sm">
        <div className="flex flex-col items-center text-center">
          <span
            aria-hidden="true"
            className="flex h-16 w-16 items-center justify-center rounded-3xl bg-amber-400 text-3xl shadow-sm"
          >
            🧠
          </span>
          <h1 className="mt-4 text-3xl font-extrabold text-zinc-900">로그인</h1>
          <p className="mt-2 text-lg text-zinc-600">
            이메일 주소만 적으면 로그인 링크를 보내드려요.
            <br />
            받은 메일에서 링크를 누르면 끝이에요.
          </p>
        </div>

        <form onSubmit={sendMagicLink} className="mt-6 flex flex-col gap-3">
          <input
            type="email"
            aria-label="이메일 주소"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="이메일 입력 (예: mom@naver.com)"
            required
            className="min-h-[56px] rounded-2xl border-2 border-amber-200 px-4 py-3 text-lg focus:border-amber-400 focus:ring-4 focus:ring-amber-300 focus:outline-none"
          />
          <button className="min-h-[56px] rounded-2xl bg-amber-400 px-4 py-3 text-lg font-bold text-zinc-900 shadow-sm hover:bg-amber-300 focus:ring-4 focus:ring-amber-300 focus:outline-none">
            로그인 링크 받기
          </button>
        </form>

        {status && (
          <p
            role="status"
            aria-live="polite"
            className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-center text-base text-amber-800"
          >
            {status}
          </p>
        )}
      </div>

      <p className="mt-5 text-center text-base text-zinc-600">
        가족이 보낸 연결 코드가 있으세요?{" "}
        <a
          href="/connect"
          className="font-bold text-amber-700 underline focus:outline-none focus-visible:ring-4 focus-visible:ring-amber-300"
        >
          가족 연결하기 →
        </a>
      </p>
    </main>
  );
}
