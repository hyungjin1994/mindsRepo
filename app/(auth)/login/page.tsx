"use client";

import { useState } from "react";
import { createClient } from "../../../lib/supabase/client";

// 이메일 + 비밀번호 로그인/회원가입.
// 자녀가 어머니 계정을 만들고(회원가입) 어머니 폰에 한 번 로그인해두면 계속 유지됩니다.
export default function LoginPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) {
      setStatus("이메일과 비밀번호를 입력해주세요.");
      return;
    }
    if (mode === "signup" && password.length < 6) {
      setStatus("비밀번호는 6자 이상으로 정해주세요.");
      return;
    }

    setLoading(true);
    setStatus(mode === "signin" ? "로그인 중이에요…" : "계정을 만들고 있어요…");
    try {
      const supabase = createClient();
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) {
          setStatus("이메일 또는 비밀번호가 맞지 않아요. 다시 해주세요.");
          setLoading(false);
          return;
        }
      } else {
        const { data, error } = await supabase.auth.signUp({ email: email.trim(), password });
        if (error) {
          setStatus(error.message.includes("already")
            ? "이미 가입된 이메일이에요. 로그인해 주세요."
            : "가입하지 못했어요. 다시 해주세요.");
          setLoading(false);
          return;
        }
        // 이메일 확인이 꺼져 있으면 곧바로 세션이 생깁니다.
        if (!data.session) {
          setStatus("가입은 됐어요. 받은 메일에서 확인을 마친 뒤 로그인해 주세요.");
          setLoading(false);
          return;
        }
      }
      // 로그인 성공 — 서버가 새 세션 쿠키를 읽도록 전체 새로고침으로 홈 이동.
      window.location.assign("/");
    } catch {
      setStatus("문제가 생겼어요. 다시 해주세요.");
      setLoading(false);
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
          <h1 className="mt-4 text-3xl font-extrabold text-zinc-900">
            {mode === "signin" ? "로그인" : "회원가입"}
          </h1>
          <p className="mt-2 text-lg text-zinc-600">
            {mode === "signin" ? "이메일과 비밀번호로 로그인하세요." : "이메일과 비밀번호로 계정을 만들어요."}
          </p>
        </div>

        <form onSubmit={submit} className="mt-6 flex flex-col gap-3">
          <input
            type="email"
            autoComplete="email"
            aria-label="이메일 주소"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="이메일 (예: mom@naver.com)"
            required
            className="min-h-[56px] rounded-2xl border-2 border-amber-200 px-4 py-3 text-lg focus:border-amber-400 focus:ring-4 focus:ring-amber-300 focus:outline-none"
          />
          <input
            type="password"
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            aria-label="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="비밀번호"
            required
            className="min-h-[56px] rounded-2xl border-2 border-amber-200 px-4 py-3 text-lg focus:border-amber-400 focus:ring-4 focus:ring-amber-300 focus:outline-none"
          />
          <button
            disabled={loading}
            className="min-h-[56px] rounded-2xl bg-amber-400 px-4 py-3 text-lg font-bold text-zinc-900 shadow-sm hover:bg-amber-300 focus:outline-none focus-visible:ring-4 focus-visible:ring-amber-300 disabled:opacity-60"
          >
            {mode === "signin" ? "로그인" : "회원가입"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => {
            setMode((m) => (m === "signin" ? "signup" : "signin"));
            setStatus(null);
          }}
          className="mt-4 w-full text-center text-base font-semibold text-amber-700 underline focus:outline-none focus-visible:ring-4 focus-visible:ring-amber-300"
        >
          {mode === "signin" ? "처음이세요? 회원가입 하기" : "이미 계정이 있어요. 로그인 하기"}
        </button>

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
