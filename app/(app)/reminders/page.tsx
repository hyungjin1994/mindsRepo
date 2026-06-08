"use client";

import React, { useEffect, useState } from "react";

type Reminder = {
  id: string;
  title: string;
  kind: string;
  scheduledAt: string;
  note: string | null;
};

const KIND_OPTIONS = [
  { value: "MEDICATION", label: "약 복용" },
  { value: "HOSPITAL", label: "병원 방문" },
  { value: "WORKOUT", label: "운동" },
  { value: "FAMILY_EVENT", label: "가족 일정" },
  { value: "OTHER", label: "기타" },
] as const;

const KIND_LABELS: Record<string, string> = Object.fromEntries(
  KIND_OPTIONS.map((o) => [o.value, o.label]),
);

function kindLabel(kind: string) {
  return KIND_LABELS[kind] ?? "기타";
}

export default function RemindersPage() {
  const [items, setItems] = useState<Reminder[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<string>("MEDICATION");
  const [scheduledAt, setScheduledAt] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function load() {
    try {
      const res = await fetch("/api/reminders");
      const j = await res.json();
      if (!res.ok || !j?.ok) {
        setLoadError(j?.message ?? "목록을 불러오지 못했어요. 다시 해주세요.");
        setItems([]);
        return;
      }
      setLoadError(null);
      setItems(j.reminders ?? []);
    } catch {
      setLoadError("목록을 불러오지 못했어요. 다시 해주세요.");
      setItems([]);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!title.trim()) {
      setFormError("제목을 적어주세요.");
      return;
    }
    if (!scheduledAt) {
      setFormError("날짜와 시간을 골라주세요.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          kind,
          scheduledAt: new Date(scheduledAt).toISOString(),
          note: note.trim() || undefined,
        }),
      });
      const j = await res.json();
      if (!res.ok || !j?.ok) {
        setFormError(j?.message ?? "일정을 저장하지 못했어요. 다시 해주세요.");
        return;
      }
      setTitle("");
      setKind("MEDICATION");
      setScheduledAt("");
      setNote("");
      await load();
    } catch {
      setFormError("일정을 저장하지 못했어요. 다시 해주세요.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-3xl font-semibold">리마인더</h1>
      <p className="mt-2 text-base text-zinc-600">약·일정 알림을 확인하고 관리합니다.</p>

      <section className="mt-8">
        <h2 className="text-2xl font-semibold">새 일정 추가</h2>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4 rounded border bg-white p-4">
          <div>
            <label htmlFor="reminder-title" className="block text-lg font-medium">
              제목
            </label>
            <input
              id="reminder-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예) 혈압약 먹기"
              aria-label="일정 제목"
              className="mt-2 block w-full min-h-[56px] rounded border border-zinc-300 px-4 py-3 text-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="reminder-kind" className="block text-lg font-medium">
              종류
            </label>
            <select
              id="reminder-kind"
              value={kind}
              onChange={(e) => setKind(e.target.value)}
              aria-label="알림 종류"
              className="mt-2 block w-full min-h-[56px] rounded border border-zinc-300 px-4 py-3 text-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
            >
              {KIND_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="reminder-when" className="block text-lg font-medium">
              날짜와 시간
            </label>
            <input
              id="reminder-when"
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              aria-label="알림 날짜와 시간"
              className="mt-2 block w-full min-h-[56px] rounded border border-zinc-300 px-4 py-3 text-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="reminder-note" className="block text-lg font-medium">
              메모 (선택)
            </label>
            <textarea
              id="reminder-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="예) 식사 후에 드세요"
              aria-label="메모"
              rows={2}
              className="mt-2 block w-full rounded border border-zinc-300 px-4 py-3 text-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          {formError && (
            <p role="alert" className="text-base text-red-600">
              {formError}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            aria-label="새 일정 추가"
            className="min-h-[56px] w-full rounded bg-amber-500 px-4 py-3 text-lg font-semibold text-white focus:ring-2 focus:ring-amber-700 focus:outline-none disabled:opacity-60"
          >
            {submitting ? "저장 중…" : "추가하기"}
          </button>
        </form>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-2xl font-semibold">등록된 일정</h2>
        {loadError && (
          <p role="alert" className="text-base text-red-600">
            {loadError}
          </p>
        )}
        {!loadError && items.length === 0 && (
          <div className="text-base text-zinc-500">등록된 리마인더가 없습니다.</div>
        )}
        {items.map((r) => (
          <div key={r.id} className="rounded border bg-white p-4">
            <div className="text-lg font-medium">{r.title}</div>
            <div className="mt-1 text-base text-amber-700">{kindLabel(r.kind)}</div>
            <div className="mt-1 text-base text-zinc-600">{r.note ?? "(메모 없음)"}</div>
            <div className="mt-2 text-base text-zinc-500">
              {new Date(r.scheduledAt).toLocaleString("ko-KR")}
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}
