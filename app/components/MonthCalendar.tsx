"use client";

import { useState } from "react";

// 노년 친화 월간 달력. 일정이 있는 날엔 점을 찍고, 날짜를 누르면 선택된다.
// 날짜 키는 기기 현지 시간(어머니=KST) 기준 "YYYY-MM-DD".

const WEEK = ["일", "월", "화", "수", "목", "금", "토"];

export function ymd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function MonthCalendar({
  eventDates,
  selected,
  onSelect,
}: {
  eventDates: Set<string>;
  selected: string;
  onSelect: (date: string) => void;
}) {
  const [cursor, setCursor] = useState(() => {
    const base = selected ? new Date(selected + "T00:00:00") : new Date();
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const startWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayKey = ymd(new Date());

  const cells: (Date | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));

  return (
    <div className="rounded-3xl border border-amber-100 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setCursor(new Date(year, month - 1, 1))}
          aria-label="이전 달"
          className="flex h-11 w-11 items-center justify-center rounded-xl border-2 border-amber-200 bg-white text-2xl text-zinc-700 hover:bg-amber-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-amber-300"
        >
          ‹
        </button>
        <div className="text-xl font-extrabold text-zinc-900">
          {year}년 {month + 1}월
        </div>
        <button
          type="button"
          onClick={() => setCursor(new Date(year, month + 1, 1))}
          aria-label="다음 달"
          className="flex h-11 w-11 items-center justify-center rounded-xl border-2 border-amber-200 bg-white text-2xl text-zinc-700 hover:bg-amber-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-amber-300"
        >
          ›
        </button>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-1 text-center text-sm font-semibold">
        {WEEK.map((w, i) => (
          <div key={w} className={i === 0 ? "text-red-500" : i === 6 ? "text-blue-500" : "text-zinc-500"}>
            {w}
          </div>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((cell, idx) => {
          if (cell === null) return <div key={idx} />;
          const key = ymd(cell);
          const isSel = key === selected;
          const isToday = key === todayKey;
          const hasEvent = eventDates.has(key);
          return (
            <button
              key={idx}
              type="button"
              onClick={() => onSelect(key)}
              aria-label={`${cell.getMonth() + 1}월 ${cell.getDate()}일${hasEvent ? ", 일정 있음" : ""}`}
              aria-pressed={isSel}
              className={
                "relative flex aspect-square items-center justify-center rounded-xl text-lg focus:outline-none focus-visible:ring-4 focus-visible:ring-amber-300 " +
                (isSel
                  ? "bg-amber-400 font-extrabold text-zinc-900"
                  : isToday
                    ? "bg-amber-100 font-bold text-zinc-900"
                    : "text-zinc-800 hover:bg-amber-50")
              }
            >
              {cell.getDate()}
              {hasEvent && (
                <span
                  aria-hidden="true"
                  className={"absolute bottom-1.5 h-1.5 w-1.5 rounded-full " + (isSel ? "bg-zinc-900" : "bg-amber-500")}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
