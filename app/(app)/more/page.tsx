import Link from "next/link";

// 하단 탭의 "더보기" — 매일 쓰지 않는 기능을 큰 버튼 메뉴로 모아둔다.
// 노년 친화: 한 줄에 하나, 큰 글씨 + 이모지 + 한글 라벨 + 한 줄 설명.
type MenuItem = {
  href: string;
  icon: string;
  label: string;
  desc: string;
};

const ITEMS: MenuItem[] = [
  { href: "/medications", icon: "💊", label: "약 관리", desc: "복용하는 약과 시간을 관리해요" },
  { href: "/reminders", icon: "📅", label: "일정·달력", desc: "달력에서 일정을 보고 추가해요" },
  { href: "/workout", icon: "🏃", label: "운동 기록", desc: "오늘 한 운동을 남겨요" },
  { href: "/family/manage", icon: "👨‍👩‍👧", label: "가족 관리", desc: "가족을 초대하고 사진을 보내요" },
  { href: "/settings", icon: "⚙️", label: "설정", desc: "글자 크기·화면 보기·알림" },
];

export default function MorePage() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-7">
      <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900">더보기</h1>
      <p className="mt-1.5 text-lg text-zinc-600">필요한 기능을 골라보세요.</p>

      <nav className="mt-6 space-y-3" aria-label="더보기 메뉴">
        {ITEMS.map((it) => (
          <Link
            key={it.href}
            href={it.href}
            aria-label={it.label}
            className="flex min-h-[88px] items-center gap-4 rounded-3xl border border-amber-100 bg-white px-5 py-4 shadow-sm hover:bg-amber-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-amber-300"
          >
            <span
              aria-hidden="true"
              className="flex h-14 w-14 flex-none items-center justify-center rounded-2xl bg-amber-100 text-3xl"
            >
              {it.icon}
            </span>
            <span className="min-w-0">
              <span className="block text-xl font-bold text-zinc-900">{it.label}</span>
              <span className="mt-0.5 block text-base text-zinc-600">{it.desc}</span>
            </span>
            <span aria-hidden="true" className="ml-auto text-2xl text-amber-400">
              ›
            </span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
