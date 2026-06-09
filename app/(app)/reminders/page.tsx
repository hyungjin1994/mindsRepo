"use client";

import React, { useEffect, useMemo, useState } from "react";
import MonthCalendar, { ymd } from "../../components/MonthCalendar";

type Reminder = {
  id: string;
  kind: string;
  title: string;
  scheduledAt: string;
  note: string | null;
  completed: boolean;
};

const KIND_OPTIONS = [
  { value: "MEDICATION", label: "약 복용" },
  { value: "HOSPITAL", label: "병원 방문" },
  { value: "WORKOUT", label: "운동" },
  { value: "FAMILY_EVENT", label: "가족 일정" },
  { value: "OTHER", label: "기타" },
] as const;
const KIND_LABEL: Record<string, string> = Object.fromEntries(KIND_OPTIONS.map((o) => [o.value, o.label]));

function localYmd(iso: string) {
  return ymd(new Date(iso));
}
function hhmm(iso: string) {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default function RemindersPage() {
  const [items, setItems] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(() => ymd(new Date()));

  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<string>("OTHER");
  const [time, setTime] = useState("09:00");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/reminders");
      const j = await res.json();
      setItems(j?.reminders ?? []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const eventDates = useMemo(() => new Set(items.map((r) => localYmd(r.scheduledAt))), [items]);
  const dayEvents = useMemo(
    () =>
      items
        .filter((r) => localYmd(r.scheduledAt) === selected)
        .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt)),
    [items, selected],
  );

  const selLabel = useMemo(() => {
    const d = new Date(selected + "T00:00:00");
    return `${d.getMonth() + 1}월 ${d.getDate()}일`;
  }, [selected]);

  async function addReminder(e: React.FormEvent) {
    e.preventDefault();
    setStatus(null);
    if (!title.trim()) {
      setStatus("제목을 적어주세요.");
      return;
    }
    const scheduledAt = new Date(`${selected}T${time}:00`); // 기기 현지시간(KST)
    if (Number.isNaN(scheduledAt.getTime())) {
      setStatus("시간을 다시 골라주세요.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, title: title.trim(), scheduledAt: scheduledAt.toISOString(), note: note.trim() || undefined }),
      });
      const j = await res.json();
      if (res.ok && j.ok) {
        setTitle("");
        setNote("");
        setStatus("일정을 추가했어요. 그 시간에 알림을 보내드릴게요.");
        await load();
      } else {
        setStatus(j?.message ?? "저장하지 못했어요. 다시 해주세요.");
      }
    } catch {
      setStatus("저장하지 못했어요. 다시 해주세요.");
    } finally {
      setSubmitting(false);
    }
  }

  async function toggle(r: Reminder) {
    try {
      const res = await fetch("/api/reminders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: r.id, completed: !r.completed }),
      });
      if (res.ok) {
        const j = await res.json();
        setItems((s) => s.map((x) => (x.id === r.id ? j.reminder : x)));
      }
    } catch {
      // ignore
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-5 py-7">
      <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900">📅 일정·알림</h1>
      <p className="mt-1.5 text-lg text-zinc-600">날짜를 누르고 일정을 추가하세요. 정한 시간에 알림을 보내드려요.</p>

      <div className="mt-6">
        <MonthCalendar eventDates={eventDates} selected={selected} onSelect={setSelected} />
      </div>

      {/* 선택한 날 일정 */}
      <section className="mt-5">
        <h2 className="text-2xl font-bold text-zinc-900">{selLabel} 일정</h2>
        {loading ? (
          <div className="mt-3 text-lg text-zinc-500">불러오는 중이에요…</div>
        ) : dayEvents.length === 0 ? (
          <div className="mt-3 rounded-3xl border border-amber-100 bg-white p-6 text-center text-lg text-zinc-600 shadow-sm">
            이 날 일정이 없어요.
          </div>
        ) : (
          <ul className="mt-3 space-y-3">
            {dayEvents.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 rounded-2xl border border-amber-100 bg-white p-4 shadow-sm">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-amber-700">{hhmm(r.scheduledAt)}</span>
                    <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-sm font-semibold text-amber-800">
                      {KIND_LABEL[r.kind] ?? "기타"}
                    </span>
                  </div>
                  <div className={"mt-1 text-lg font-semibold " + (r.completed ? "text-zinc-400 line-through" : "text-zinc-900")}>
                    {r.title}
                  </div>
                  {r.note && <div className="text-base text-zinc-500">{r.note}</div>}
                </div>
                <button
                  type="button"
                  onClick={() => toggle(r)}
                  aria-label={r.completed ? `${r.title} 완료 취소` : `${r.title} 완료 표시`}
                  className={
                    "min-h-[52px] flex-none rounded-2xl px-4 py-2 text-base font-bold focus:outline-none focus-visible:ring-4 focus-visible:ring-amber-300 " +
                    (r.completed
                      ? "bg-green-600 text-white hover:bg-green-700"
                      : "border-2 border-amber-300 bg-white text-zinc-800 hover:bg-amber-100")
                  }
                >
                  {r.completed ? "✓ 완료" : "완료"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 이 날에 일정 추가 */}
      <section className="mt-5 rounded-3xl border border-amber-100 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-zinc-900">{selLabel}에 일정 추가</h2>
        <form onSubmit={addReminder} className="mt-4 space-y-4">
          <div className="flex gap-3">
            <div className="flex-none">
              <label htmlFor="rem-time" className="block text-lg font-semibold text-zinc-800">
                시간
              </label>
              <input
                id="rem-time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="mt-2 min-h-[56px] rounded-2xl border-2 border-amber-200 px-3 py-3 text-lg focus:border-amber-400 focus:ring-4 focus:ring-amber-300 focus:outline-none"
              />
            </div>
            <div className="flex-1">
              <label htmlFor="rem-kind" className="block text-lg font-semibold text-zinc-800">
                종류
              </label>
              <select
                id="rem-kind"
                value={kind}
                onChange={(e) => setKind(e.target.value)}
                className="mt-2 min-h-[56px] w-full rounded-2xl border-2 border-amber-200 px-3 py-3 text-lg focus:border-amber-400 focus:ring-4 focus:ring-amber-300 focus:outline-none"
              >
                {KIND_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="rem-title" className="block text-lg font-semibold text-zinc-800">
              제목
            </label>
            <input
              id="rem-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예) 내과 진료"
              className="mt-2 min-h-[56px] w-full rounded-2xl border-2 border-amber-200 px-4 py-3 text-lg focus:border-amber-400 focus:ring-4 focus:ring-amber-300 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="rem-note" className="block text-lg font-semibold text-zinc-800">
              메모 (선택)
            </label>
            <textarea
              id="rem-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="예) 진료카드 챙기기"
              className="mt-2 w-full rounded-2xl border-2 border-amber-200 px-4 py-3 text-lg focus:border-amber-400 focus:ring-4 focus:ring-amber-300 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="min-h-[56px] w-full rounded-2xl bg-amber-400 px-4 py-3 text-lg font-bold text-zinc-900 shadow-sm hover:bg-amber-300 focus:outline-none focus-visible:ring-4 focus-visible:ring-amber-300 disabled:opacity-60"
          >
            {submitting ? "저장 중…" : "일정 추가하기"}
          </button>
        </form>
        {status && (
          <div role="status" aria-live="polite" className="mt-3 rounded-2xl bg-amber-50 px-4 py-3 text-center text-base text-amber-800">
            {status}
          </div>
        )}
      </section>
    </div>
  );
}
