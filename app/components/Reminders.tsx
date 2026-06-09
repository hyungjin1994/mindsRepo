"use client";

import React, { useEffect, useState } from "react";

type Reminder = { id: string; kind: string; title: string; scheduledAt?: string; time?: string; completed: boolean };

export default function Reminders({ reminders: initialReminders, userId }: { reminders?: Reminder[]; userId?: string }) {
  const [items, setItems] = useState<Reminder[]>(initialReminders ?? []);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userId) {
      (async () => {
        setLoading(true);
        try {
          const res = await fetch(`/api/reminders?userId=${encodeURIComponent(userId)}`);
          if (res.ok) {
            const json = await res.json();
            if (json.reminders) setItems(json.reminders);
          }
        } catch (e) {
          // ignore
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [userId]);

  async function toggle(id: string) {
    try {
      const res = await fetch(`/api/reminders`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, completed: !items.find(i => i.id === id)?.completed }) });
      if (!res.ok) return;
      const json = await res.json();
      setItems((s) => s.map((r) => (r.id === id ? json.reminder : r)));
    } catch (e) {
      // ignore
    }
  }

  return (
    <section className="rounded-3xl border border-amber-100 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-2">
        <span aria-hidden="true" className="text-2xl">⏰</span>
        <h3 className="text-2xl font-bold text-zinc-900">오늘의 알림</h3>
      </div>
      {loading ? (
        <div className="mt-3 text-lg text-zinc-500">불러오는 중이에요...</div>
      ) : items.length === 0 ? (
        <div className="mt-3 rounded-2xl bg-amber-50/70 px-4 py-5 text-center text-lg text-zinc-600">
          오늘 예정된 알림이 없어요.
        </div>
      ) : (
        <ul className="mt-4 space-y-3">
          {items.map((r) => (
            <li
              key={r.id}
              className="flex items-center justify-between gap-3 rounded-2xl bg-amber-50/60 px-4 py-3"
            >
              <div>
                <div className="text-lg font-semibold text-zinc-900">{r.title}</div>
                <div className="text-base text-zinc-500">
                  {r.time ?? new Date(r.scheduledAt ?? "").toLocaleTimeString()}
                </div>
              </div>
              <button
                aria-label={r.completed ? `${r.title} 완료 취소` : `${r.title} 완료로 표시`}
                onClick={() => toggle(r.id)}
                className={`min-h-[56px] rounded-2xl px-5 py-3 text-base font-bold focus:ring-4 focus:ring-amber-300 focus:outline-none ${
                  r.completed
                    ? "bg-green-600 text-white hover:bg-green-700"
                    : "border-2 border-amber-300 bg-white text-zinc-800 hover:bg-amber-100"
                }`}
              >
                {r.completed ? "✓ 완료" : "완료하기"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
