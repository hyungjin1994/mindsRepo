"use client";

import { useEffect, useState } from "react";
import { createClient } from "../../lib/supabase/client";

// 내 이름(호칭) 보기/수정. Supabase user_metadata.full_name 과 Prisma User.name 을 함께 갱신.
export default function NameSetting() {
  const [name, setName] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/auth/me");
        const j = await res.json();
        if (j?.user?.name) setName(j.user.name);
      } catch {
        // ignore
      }
    })();
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setStatus("이름을 적어주세요.");
      return;
    }
    setSaving(true);
    setStatus("저장 중…");
    try {
      const supabase = createClient();
      await supabase.auth.updateUser({ data: { full_name: name.trim() } });
      await fetch("/api/user/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      setStatus("저장했어요! 화면 인사말에 반영돼요.");
    } catch {
      setStatus("저장하지 못했어요. 다시 해주세요.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-[1.75rem] bg-white p-6 shadow-soft">
      <h2 className="text-2xl font-bold text-zinc-900">🙂 내 이름</h2>
      <p className="mt-1.5 text-base text-zinc-600">앱이 불러줄 이름(호칭)이에요. 홈 화면 인사말에 쓰여요.</p>
      <form onSubmit={save} className="mt-4 flex flex-col gap-3">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="예: 엄마, 김영희"
          aria-label="내 이름"
          className="min-h-[56px] rounded-2xl border-2 border-amber-200 px-4 py-3 text-lg focus:border-amber-400 focus:ring-4 focus:ring-amber-300 focus:outline-none"
        />
        <button
          type="submit"
          disabled={saving}
          className="min-h-[56px] rounded-2xl bg-amber-400 px-4 py-3 text-lg font-bold text-zinc-900 shadow-sm hover:bg-amber-300 focus:outline-none focus-visible:ring-4 focus-visible:ring-amber-300 disabled:opacity-60"
        >
          {saving ? "저장 중…" : "이름 저장"}
        </button>
      </form>
      {status && (
        <div role="status" aria-live="polite" className="mt-3 rounded-2xl bg-amber-50 px-4 py-3 text-center text-base text-amber-800">
          {status}
        </div>
      )}
    </section>
  );
}
