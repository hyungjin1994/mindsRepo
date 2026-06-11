"use client";

import React, { useEffect, useState } from "react";
import PhotoUpload from "../../../components/PhotoUpload";

type FamilyPost = {
  id: string;
  kind?: string;
  text?: string | null;
  imageUrl?: string | null;
  createdAt?: string;
  sender?: { name?: string | null } | null;
};

type MyPhoto = { id: string; url: string; thumbUrl?: string | null; caption?: string | null };

function formatDateTime(value?: string) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("ko-KR", { month: "long", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export default function FamilyFeedPage() {
  const [posts, setPosts] = useState<FamilyPost[]>([]);
  const [myPhotos, setMyPhotos] = useState<MyPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadPosts() {
    setLoading(true);
    setError(null);
    try {
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

  async function loadMyPhotos() {
    try {
      const res = await fetch("/api/uploads/photo");
      const j = await res.json();
      if (res.ok && j?.ok) setMyPhotos(j.photos ?? []);
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    loadPosts();
    loadMyPhotos();
  }, []);

  return (
    <div className="mx-auto max-w-2xl px-5 py-7">
      <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900">💌 가족</h1>
      <p className="mt-1.5 text-lg text-zinc-600">사진을 올리고, 가족이 보낸 소식을 확인하세요.</p>

      {/* 사진 올리기 */}
      <div className="mt-6">
        <PhotoUpload onUploaded={loadMyPhotos} />
      </div>

      {/* 내가 올린 사진 */}
      {myPhotos.length > 0 && (
        <section className="mt-5 rounded-[1.75rem] bg-white p-6 shadow-soft">
          <h2 className="text-xl font-extrabold text-zinc-900">내가 올린 사진</h2>
          <div className="mt-4 grid grid-cols-3 gap-3">
            {myPhotos.map((p) => (
              <div key={p.id} className="aspect-square overflow-hidden rounded-2xl bg-amber-100 ring-1 ring-black/5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.thumbUrl ?? p.url} alt={p.caption ?? "내가 올린 사진"} className="h-full w-full object-cover" />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 가족이 보낸 소식 */}
      <section className="mt-5">
        <h2 className="text-2xl font-bold text-zinc-900">가족이 보낸 소식</h2>
        <div className="mt-3 space-y-4">
          {loading && <div className="text-lg text-zinc-500">불러오는 중이에요…</div>}

          {!loading && error && (
            <div role="alert" className="rounded-2xl border border-amber-300 bg-amber-50 p-5 text-lg text-amber-900">
              {error}
            </div>
          )}

          {!loading && !error && posts.length === 0 && (
            <div className="rounded-[1.75rem] bg-white p-8 text-center text-lg text-zinc-500 shadow-soft">
              아직 받은 소식이 없어요.
            </div>
          )}

          {!loading &&
            !error &&
            posts.map((post) => {
              const senderName = post.sender?.name ?? "가족";
              const dateText = formatDateTime(post.createdAt);
              return (
                <article key={post.id} className="rounded-[1.75rem] bg-white p-6 shadow-soft">
                  <div className="text-base font-bold text-amber-700">{senderName}</div>
                  {post.text && (
                    <p className="mt-2 whitespace-pre-wrap text-lg leading-relaxed text-zinc-900">{post.text}</p>
                  )}
                  {post.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={post.imageUrl}
                      alt={`${senderName}님이 보낸 사진`}
                      className="mt-4 w-full rounded-2xl object-cover"
                    />
                  )}
                  {dateText && <div className="mt-3 text-base text-zinc-500">{dateText}</div>}
                </article>
              );
            })}
        </div>
      </section>
    </div>
  );
}
