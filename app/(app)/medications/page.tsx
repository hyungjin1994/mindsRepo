"use client";

import React, { useEffect, useState } from "react";

type Medication = {
  id: string;
  name: string;
  dosage: string | null;
  schedule: { times?: string[] } | null;
};

const PRESETS = [
  { label: "아침", time: "08:00" },
  { label: "점심", time: "12:00" },
  { label: "저녁", time: "18:00" },
  { label: "자기 전", time: "21:00" },
];

function timeLabel(t: string) {
  return PRESETS.find((p) => p.time === t)?.label ?? t;
}

export default function MedicationsPage() {
  const [items, setItems] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [dosage, setDosage] = useState("");
  const [times, setTimes] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/medications");
      const j = await res.json();
      setItems(j?.data ?? []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function toggleTime(t: string) {
    setTimes((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  }

  async function addMed(e: React.FormEvent) {
    e.preventDefault();
    setStatus(null);
    if (!name.trim()) {
      setStatus("약 이름을 적어주세요.");
      return;
    }
    if (times.length === 0) {
      setStatus("약 먹는 시간을 한 개 이상 골라주세요.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/medications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), dosage: dosage.trim() || undefined, times }),
      });
      const j = await res.json();
      if (res.ok && j.ok) {
        setStatus("저장했어요. 복용 시간에 알림을 보내드릴게요.");
        setName("");
        setDosage("");
        setTimes([]);
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

  async function removeMed(id: string) {
    try {
      const res = await fetch(`/api/medications?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      if (res.ok) setItems((prev) => prev.filter((m) => m.id !== id));
    } catch {
      // ignore
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-5 py-7">
      <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900">💊 약 관리</h1>
      <p className="mt-1.5 text-lg text-zinc-600">약과 먹는 시간을 등록하면 그 시간에 알림을 보내드려요.</p>

      {/* 약 추가 */}
      <section className="mt-6 rounded-3xl border border-amber-100 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-zinc-900">약 추가</h2>
        <form onSubmit={addMed} className="mt-4 space-y-4">
          <div>
            <label htmlFor="med-name" className="block text-lg font-semibold text-zinc-800">
              약 이름
            </label>
            <input
              id="med-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예) 혈압약"
              className="mt-2 min-h-[56px] w-full rounded-2xl border-2 border-amber-200 px-4 py-3 text-lg focus:border-amber-400 focus:ring-4 focus:ring-amber-300 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="med-dosage" className="block text-lg font-semibold text-zinc-800">
              용량 (선택)
            </label>
            <input
              id="med-dosage"
              type="text"
              value={dosage}
              onChange={(e) => setDosage(e.target.value)}
              placeholder="예) 1알"
              className="mt-2 min-h-[56px] w-full rounded-2xl border-2 border-amber-200 px-4 py-3 text-lg focus:border-amber-400 focus:ring-4 focus:ring-amber-300 focus:outline-none"
            />
          </div>

          <div>
            <span className="block text-lg font-semibold text-zinc-800">먹는 시간</span>
            <div className="mt-2 grid grid-cols-2 gap-3">
              {PRESETS.map((p) => {
                const on = times.includes(p.time);
                return (
                  <button
                    key={p.time}
                    type="button"
                    onClick={() => toggleTime(p.time)}
                    aria-pressed={on}
                    className={
                      "min-h-[56px] rounded-2xl border-2 px-4 py-3 text-lg font-bold focus:outline-none focus-visible:ring-4 focus-visible:ring-amber-300 " +
                      (on
                        ? "border-amber-400 bg-amber-400 text-zinc-900"
                        : "border-amber-200 bg-white text-zinc-700 hover:bg-amber-50")
                    }
                  >
                    {p.label} <span className="text-base font-medium">{p.time}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="min-h-[56px] w-full rounded-2xl bg-amber-400 px-4 py-3 text-lg font-bold text-zinc-900 shadow-sm hover:bg-amber-300 focus:outline-none focus-visible:ring-4 focus-visible:ring-amber-300 disabled:opacity-60"
          >
            {submitting ? "저장 중…" : "약 추가하기"}
          </button>
        </form>
        {status && (
          <div role="status" aria-live="polite" className="mt-3 rounded-2xl bg-amber-50 px-4 py-3 text-center text-base text-amber-800">
            {status}
          </div>
        )}
      </section>

      {/* 등록된 약 */}
      <section className="mt-6">
        <h2 className="text-2xl font-bold text-zinc-900">등록된 약</h2>
        {loading ? (
          <div className="mt-3 text-lg text-zinc-500">불러오는 중이에요…</div>
        ) : items.length === 0 ? (
          <div className="mt-3 rounded-3xl border border-amber-100 bg-white p-8 text-center text-lg text-zinc-600 shadow-sm">
            아직 등록한 약이 없어요.
          </div>
        ) : (
          <ul className="mt-3 space-y-3">
            {items.map((m) => (
              <li key={m.id} className="rounded-2xl border border-amber-100 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-xl font-bold text-zinc-900">{m.name}</div>
                    {m.dosage && <div className="mt-0.5 text-base text-zinc-600">{m.dosage}</div>}
                    <div className="mt-2 flex flex-wrap gap-2">
                      {(m.schedule?.times ?? []).map((t) => (
                        <span key={t} className="rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-800">
                          {timeLabel(t)} {t}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeMed(m.id)}
                    aria-label={`${m.name} 삭제`}
                    className="min-h-[48px] flex-none rounded-xl border-2 border-zinc-200 bg-white px-4 py-2 text-base font-semibold text-zinc-600 hover:bg-zinc-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-amber-300"
                  >
                    삭제
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
