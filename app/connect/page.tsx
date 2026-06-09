"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// 자녀·가족용 연결 화면 — 엄마가 알려준 코드를 입력하면 연결된다 (로그인 불필요).
// 코드는 FamilyMember.accessToken 이며, 확인되면 /family/<코드> 로 이동한다.
export default function ConnectPage() {
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function connect(e: React.FormEvent) {
    e.preventDefault();
    const c = code.trim().toUpperCase();
    if (!c) {
      setStatus("코드를 입력해주세요.");
      return;
    }
    setLoading(true);
    setStatus("연결하고 있어요…");
    try {
      const res = await fetch(`/api/family/resolve?code=${encodeURIComponent(c)}`);
      const j = await res.json().catch(() => ({}));
      if (j?.valid) {
        router.push(`/family/${c}`);
      } else {
        setStatus("코드를 다시 확인해주세요.");
        setLoading(false);
      }
    } catch {
      setStatus("연결하지 못했어요. 다시 해주세요.");
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
            🔗
          </span>
          <h1 className="mt-4 text-3xl font-extrabold text-zinc-900">가족 연결</h1>
          <p className="mt-2 text-lg text-zinc-600">
            가족이 알려준 <b>연결 코드</b>를 입력하세요.
          </p>
        </div>

        <form onSubmit={connect} className="mt-6 flex flex-col gap-3">
          <input
            type="text"
            inputMode="text"
            autoCapitalize="characters"
            aria-label="연결 코드"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="예: K7P2QM"
            maxLength={10}
            className="min-h-[64px] rounded-2xl border-2 border-amber-200 px-4 py-3 text-center text-3xl font-extrabold tracking-[0.2em] uppercase focus:border-amber-400 focus:ring-4 focus:ring-amber-300 focus:outline-none"
          />
          <button
            disabled={loading}
            className="min-h-[56px] rounded-2xl bg-amber-400 px-4 py-3 text-lg font-bold text-zinc-900 shadow-sm hover:bg-amber-300 focus:outline-none focus-visible:ring-4 focus-visible:ring-amber-300 disabled:opacity-60"
          >
            {loading ? "연결 중…" : "연결하기"}
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
    </main>
  );
}
