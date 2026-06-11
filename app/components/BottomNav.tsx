"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// 노년 친화 하단 탭 — 앱처럼 항상 손 닿는 곳에. 큰 터치 영역(높이 64px+),
// 아이콘만 쓰지 않고 한글 라벨을 항상 동반한다. 강조색은 앰버.
type Tab = {
  href: string;
  label: string;
  icon: string;
  match: (path: string) => boolean;
};

// 더보기 탭에 묶인 하위 화면들 (약/운동/알림/가족관리) — 이 화면에 있으면 더보기를 활성표시.
const MORE_PATHS = ["/more", "/medications", "/workout", "/reminders", "/family/manage"];

const TABS: Tab[] = [
  { href: "/", label: "홈", icon: "🏠", match: (p) => p === "/" },
  { href: "/games", label: "게임", icon: "🎮", match: (p) => p.startsWith("/games") },
  { href: "/family/feed", label: "가족", icon: "💌", match: (p) => p.startsWith("/family/feed") },
  { href: "/points", label: "포인트", icon: "⭐", match: (p) => p.startsWith("/points") },
  { href: "/more", label: "더보기", icon: "☰", match: (p) => MORE_PATHS.some((x) => p.startsWith(x)) },
];

export default function BottomNav() {
  const pathname = usePathname() ?? "/";

  return (
    <nav
      aria-label="주요 메뉴"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-amber-100/70 bg-white/90 shadow-[0_-6px_24px_rgb(120_90_20_/_0.06)] backdrop-blur-md"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto flex max-w-2xl items-stretch justify-around">
        {TABS.map((tab) => {
          const active = tab.match(pathname);
          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                aria-label={tab.label}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-[64px] flex-col items-center justify-center gap-1 px-1 py-2 text-center focus:outline-none focus-visible:ring-4 focus-visible:ring-amber-300 ${
                  active ? "text-amber-700" : "text-zinc-500"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`flex h-9 w-14 items-center justify-center rounded-full text-2xl transition-all duration-200 ${
                    active ? "scale-105 bg-amber-200" : "bg-transparent"
                  }`}
                >
                  {tab.icon}
                </span>
                <span className={`text-[13px] ${active ? "font-extrabold" : "font-medium"}`}>{tab.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
