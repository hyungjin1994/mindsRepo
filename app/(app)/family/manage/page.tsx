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
  // 연결 코드 만들기
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState("CHILD");
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState<{ code: string; link: string } | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [copyMsg, setCopyMsg] = useState<string | null>(null);

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

  async function createCode(e: React.FormEvent) {
    e.preventDefault();
    setCreateError(null);
    if (!newName.trim()) {
      setCreateError("가족의 호칭을 적어주세요.");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/family/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), role: newRole }),
      });
      const j = await res.json();
      if (res.ok && j.ok) {
        setCreated({ code: j.code, link: j.link });
        setNewName("");
        if (j.member) setMembers((prev) => [j.member as FamilyMember, ...prev]);
      } else {
        setCreateError(j?.message ?? "코드를 만들지 못했어요. 다시 해주세요.");
      }
    } catch {
      setCreateError("코드를 만들지 못했어요. 다시 해주세요.");
    } finally {
      setCreating(false);
    }
  }

  async function copyText(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopyMsg(`${label}을(를) 복사했어요`);
      window.setTimeout(() => setCopyMsg(null), 2000);
    } catch {
      setCopyMsg("복사가 안 돼요. 직접 적어주세요.");
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-5 py-7">
      <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900">👨‍👩‍👧 가족 관리</h1>
      <p className="mt-1.5 text-lg text-zinc-600">
        가족을 초대하고 사진·메시지를 주고받아요.
      </p>

      <section className="mt-6 rounded-3xl border border-amber-100 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-zinc-900">🔗 연결 코드 만들기</h2>
        <p className="mt-1.5 text-base text-zinc-600">
          가족의 호칭을 적고 코드를 만든 뒤, 그 코드를 알려주세요. 받은 사람은 앱에서{" "}
          <b>가족 연결</b>에 코드를 넣으면 연결돼요.
        </p>

        <form onSubmit={createCode} className="mt-4 space-y-3">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="예) 아들, 큰딸, 손주"
            aria-label="가족 호칭"
            className="min-h-[56px] w-full rounded-2xl border-2 border-amber-200 px-4 py-3 text-lg focus:border-amber-400 focus:ring-4 focus:ring-amber-300 focus:outline-none"
          />
          <select
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
            aria-label="관계"
            className="min-h-[56px] w-full rounded-2xl border-2 border-amber-200 px-4 py-3 text-lg focus:border-amber-400 focus:ring-4 focus:ring-amber-300 focus:outline-none"
          >
            <option value="CHILD">자녀 (아들·딸)</option>
            <option value="CHILD_IN_LAW">사위·며느리</option>
            <option value="GRANDCHILD">손주</option>
            <option value="OTHER">그 외 가족</option>
          </select>
          <button
            type="submit"
            disabled={creating}
            aria-label="연결 코드 만들기"
            className="min-h-[56px] w-full rounded-2xl bg-amber-400 px-4 py-3 text-lg font-bold text-zinc-900 shadow-sm hover:bg-amber-300 focus:outline-none focus-visible:ring-4 focus-visible:ring-amber-300 disabled:opacity-60"
          >
            {creating ? "만드는 중…" : "코드 만들기"}
          </button>
        </form>

        {createError && (
          <p role="alert" className="mt-3 text-base text-red-600">
            {createError}
          </p>
        )}

        {created && (
          <div className="mt-4 rounded-2xl bg-amber-50 p-5 text-center">
            <div className="text-base font-medium text-amber-800">이 코드를 가족에게 알려주세요</div>
            <div className="mt-1 text-4xl font-extrabold tracking-[0.2em] text-zinc-900">{created.code}</div>
            <div className="mt-4 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => copyText(created.code, "코드")}
                className="min-h-[52px] rounded-2xl bg-amber-400 px-4 py-3 text-base font-bold text-zinc-900 hover:bg-amber-300 focus:outline-none focus-visible:ring-4 focus-visible:ring-amber-300"
              >
                코드 복사
              </button>
              <button
                type="button"
                onClick={() => copyText(created.link, "연결 링크")}
                className="min-h-[52px] rounded-2xl border-2 border-amber-300 bg-white px-4 py-3 text-base font-semibold text-zinc-800 hover:bg-amber-100 focus:outline-none focus-visible:ring-4 focus-visible:ring-amber-300"
              >
                연결 링크 복사
              </button>
            </div>
            <div className="mt-2 break-all text-sm text-zinc-500">{created.link}</div>
            {copyMsg && (
              <div role="status" aria-live="polite" className="mt-2 text-base font-semibold text-green-700">
                {copyMsg}
              </div>
            )}
          </div>
        )}
      </section>

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
