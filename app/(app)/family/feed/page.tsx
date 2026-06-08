"use client";

import React, { useEffect, useState } from "react";

type FamilyPost = {
  id: string;
  kind?: string;
  text?: string | null;
  imageUrl?: string | null;
  createdAt?: string;
  readAt?: string | null;
  sender?: { name?: string | null } | null;
};

// 받은 가족 메시지/사진을 한글 날짜·시간으로 표시
function formatDateTime(value?: string) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function FamilyFeedPage() {
  const [posts, setPosts] = useState<FamilyPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        // API 응답 형태: { ok, posts }
        const res = await fetch("/api/family/feed");
        const j = await res.json();
        if (!res.ok || !j?.ok) {
          setError(j?.message ?? "불러오지 못했어요. 다시 해주세요.");
          setPosts([]);
        } else {
          setPosts(j.posts ?? []);
        }
      } catch {
        setError("불러오지 못했어요. 다시 해주세요.");
        setPosts([]);
      }
      setLoading(false);
    }
    load();
  }, []);

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-3xl font-semibold">가족 피드</h1>
      <p className="mt-3 text-lg text-zinc-700">가족이 보낸 메시지와 사진을 확인하세요.</p>

      <section className="mt-8 space-y-6">
        {loading && <div className="text-lg text-zinc-600">불러오는 중이에요.</div>}

        {!loading && error && (
          <div
            role="alert"
            className="rounded-2xl border border-amber-300 bg-amber-50 p-5 text-lg text-amber-900"
          >
            {error}
          </div>
        )}

        {!loading && !error && posts.length === 0 && (
          <div className="rounded-2xl border bg-white p-6 text-lg text-zinc-600">
            아직 받은 메시지가 없어요.
          </div>
        )}

        {!loading &&
          !error &&
          posts.map((post) => {
            const senderName = post.sender?.name ?? "가족";
            const dateText = formatDateTime(post.createdAt);
            return (
              <article
                key={post.id}
                className="rounded-2xl border bg-white p-6 shadow-sm"
              >
                <div className="text-base font-semibold text-zinc-800">
                  {senderName}
                </div>

                {post.text && (
                  <p className="mt-3 whitespace-pre-wrap text-lg leading-relaxed text-zinc-900">
                    {post.text}
                  </p>
                )}

                {post.imageUrl && (
                  <img
                    src={post.imageUrl}
                    alt={`${senderName}님이 보낸 사진`}
                    className="mt-4 w-full rounded-xl object-cover"
                  />
                )}

                {dateText && (
                  <div className="mt-4 text-base text-zinc-500">{dateText}</div>
                )}
              </article>
            );
          })}
      </section>
    </main>
  );
}
