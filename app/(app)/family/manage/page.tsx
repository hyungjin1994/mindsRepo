"use client";

import React, { useEffect, useState } from "react";
import PhotoUpload from "../../../components/PhotoUpload";

type FamilyMember = {
  id: string;
  name: string;
  role: string;
  accessToken: string;
};

export default function FamilyManagePage() {
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(false);
  // 로그인한 어머니의 실제 사용자 id. 미로그인 시 null.
  const [userId, setUserId] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  // 토큰별 보기 토글 상태 — 기본값은 숨김.
  const [shownTokens, setShownTokens] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      // 실제 로그인 사용자 id 확인 (CONTRACT: /api/auth/me → { ok, user }).
      try {
        const meRes = await fetch("/api/auth/me");
        if (meRes.ok) {
          const me = await meRes.json();
          if (me?.ok && me?.user?.id) setUserId(me.user.id as string);
        }
      } catch {}
      setAuthChecked(true);

      // 등록된 가족 목록 (CONTRACT: /api/family/list → { ok, family }).
      try {
        const res = await fetch("/api/family/list");
        if (res.ok) {
          const j = await res.json();
          setMembers((j.family ?? []) as FamilyMember[]);
        }
      } catch {}
      setLoading(false);
    })();
  }, []);

  function toggleToken(id: string) {
    setShownTokens((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  async function copyToken(id: string, token: string) {
    try {
      await navigator.clipboard.writeText(token);
      setCopiedId(id);
      window.setTimeout(() => setCopiedId((cur) => (cur === id ? null : cur)), 2000);
    } catch {
      // 복사 권한이 없거나 실패한 경우 — 직접 토큰을 보여줘서 손으로 복사하게 합니다.
      setShownTokens((prev) => ({ ...prev, [id]: true }));
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-5 py-7">
      <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900">👨‍👩‍👧 가족 관리</h1>
      <p className="mt-1.5 text-lg text-zinc-600">
        가족을 초대하고 사진·메시지를 주고받아요.
      </p>

      <section className="mt-6">
        <h2 className="text-2xl font-bold text-zinc-900">등록된 가족</h2>
        {loading ? (
          <div className="mt-3 text-base">불러오는 중이에요…</div>
        ) : members.length === 0 ? (
          <div className="mt-3 text-base text-zinc-600">아직 등록된 가족이 없어요.</div>
        ) : (
          <ul className="mt-3 space-y-3">
            {members.map((m) => {
              const shown = !!shownTokens[m.id];
              return (
                <li key={m.id} className="rounded-2xl border border-amber-100 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-lg font-medium text-zinc-900">{m.name}</div>
                      <div className="text-base text-zinc-500">{m.role}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleToken(m.id)}
                      aria-pressed={shown}
                      aria-label={shown ? `${m.name} 토큰 숨기기` : `${m.name} 토큰 보기`}
                      className="min-h-[56px] rounded-lg border border-zinc-300 bg-white px-5 text-base font-medium text-zinc-700 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    >
                      {shown ? "토큰 숨기기" : "토큰 보기"}
                    </button>
                  </div>

                  {shown && (
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <code className="break-all rounded bg-zinc-100 px-3 py-3 text-base text-zinc-800">
                        {m.accessToken}
                      </code>
                      <button
                        type="button"
                        onClick={() => copyToken(m.id, m.accessToken)}
                        aria-label={`${m.name} 토큰 복사`}
                        className="min-h-[56px] rounded-lg border border-yellow-500 bg-yellow-100 px-5 text-base font-medium text-zinc-900 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      >
                        {copiedId === m.id ? "복사했어요" : "복사"}
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="mt-6">
        {!authChecked ? (
          <div className="text-base text-zinc-600">불러오는 중이에요…</div>
        ) : userId ? (
          <PhotoUpload userId={userId} />
        ) : (
          <div
            role="status"
            className="rounded-2xl border border-amber-100 bg-white p-5 text-base text-zinc-700 shadow-sm"
          >
            로그인이 필요합니다.
          </div>
        )}
      </section>
    </div>
  );
}
