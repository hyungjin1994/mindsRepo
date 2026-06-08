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
    <section className="mt-4 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
      <h3 className="text-lg font-semibold">오늘의 알림</h3>
      {loading ? (
        <div className="mt-2 text-base text-zinc-500">불러오는 중이에요...</div>
      ) : (
        <ul className="mt-3 space-y-3">
          {items.map((r) => (
            <li key={r.id} className="flex items-center justify-between">
              <div>
                <div className="text-base font-medium">{r.title}</div>
                <div className="text-base text-zinc-500">{r.time ?? new Date(r.scheduledAt ?? "").toLocaleTimeString()}</div>
              </div>
              <button
                aria-label={r.completed ? `${r.title} 완료 취소` : `${r.title} 완료로 표시`}
                onClick={() => toggle(r.id)}
                className={`min-h-[56px] rounded-full px-4 py-3 text-base focus:ring-2 focus:ring-blue-500 focus:outline-none ${r.completed ? "bg-green-600 text-white" : "border"}`}
              >
                {r.completed ? "완료" : "완료"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
