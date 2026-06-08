"use client";

import { useEffect, useState } from "react";

// 노년 친화 화면 설정: 글자 크기 + 고대비. 전역(html 요소)에 적용하고 localStorage 에 저장한다.
// 로그인 상태면 서버(User.fontScale / highContrast)에도 best-effort 로 저장.

const FONT_PRESETS = [
  { label: "보통", px: 18 },
  { label: "크게", px: 21 },
  { label: "아주 크게", px: 25 },
];

function persistServer(payload: { highContrast?: boolean; fontScale?: number }) {
  fetch("/api/user/settings", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).catch(() => {
    /* 로그아웃 상태 등 — localStorage 만으로 충분하므로 무시 */
  });
}

export default function A11yControls() {
  const [fontPx, setFontPx] = useState(18);
  const [hc, setHc] = useState(false);

  // 저장된 설정 복원 (최초 1회)
  useEffect(() => {
    const savedFont = Number(localStorage.getItem("minds:fontPx"));
    if (savedFont >= 14 && savedFont <= 40) setFontPx(savedFont);
    setHc(localStorage.getItem("minds:hc") === "1");
  }, []);

  // 글자 크기 적용 + 저장 (Tailwind text-* 는 rem 기반이라 html font-size 로 전체가 스케일됨)
  useEffect(() => {
    document.documentElement.style.setProperty("--app-font-size", `${fontPx}px`);
    localStorage.setItem("minds:fontPx", String(fontPx));
  }, [fontPx]);

  // 고대비 적용 + 저장
  useEffect(() => {
    document.documentElement.classList.toggle("hc", hc);
    localStorage.setItem("minds:hc", hc ? "1" : "0");
  }, [hc]);

  function chooseFont(px: number) {
    setFontPx(px);
    persistServer({ fontScale: px / 18 });
  }
  function toggleContrast() {
    const next = !hc;
    setHc(next);
    persistServer({ highContrast: next });
  }

  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="화면 보기 설정">
      <span aria-hidden className="text-base text-zinc-600">글자</span>
      {FONT_PRESETS.map((p) => (
        <button
          key={p.px}
          type="button"
          aria-pressed={fontPx === p.px}
          aria-label={`글자 크기 ${p.label}`}
          onClick={() => chooseFont(p.px)}
          className={
            "min-h-[44px] rounded border px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 " +
            (fontPx === p.px
              ? "border-blue-600 bg-blue-50 font-semibold text-zinc-900"
              : "border-zinc-300 bg-white text-zinc-700")
          }
        >
          {p.label}
        </button>
      ))}
      <button
        type="button"
        aria-pressed={hc}
        aria-label="고대비 모드"
        onClick={toggleContrast}
        className={
          "min-h-[44px] rounded border px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 " +
          (hc
            ? "border-black bg-black font-semibold text-white"
            : "border-zinc-300 bg-white text-zinc-700")
        }
      >
        고대비
      </button>
    </div>
  );
}
