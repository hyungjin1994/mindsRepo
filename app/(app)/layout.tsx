import { redirect } from "next/navigation";
import { getOrCreateUser } from "../../lib/auth";
import BottomNav from "../components/BottomNav";

// (app) 그룹 = 어머니 전용 앱 영역. 상단 바 + 본문 + 하단 탭으로 "앱처럼" 감싼다.
//
// 가드: 로그인하지 않았으면 로그인 화면으로 보낸다. 세션은 쿠키에 저장되고 proxy.ts 가
// 매 요청마다 갱신하므로, 한 번 로그인하면 다음 방문엔 자동으로 입장한다.
// (자녀용 /connect, /family/* 는 (app) 밖이라 가드의 영향을 받지 않는다.)
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const mapped = await getOrCreateUser().catch(() => null);
  if (!mapped) {
    redirect("/login");
  }
  const user = mapped.prismaUser;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 border-b border-amber-100/80 bg-white/85 px-4 py-2.5 backdrop-blur">
        <div className="mx-auto flex max-w-2xl flex-wrap items-center justify-between gap-2">
          <a href="/" className="flex items-center gap-2" aria-label="minds 홈">
            <span
              aria-hidden="true"
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-400 text-xl shadow-sm"
            >
              🧠
            </span>
            <span className="text-lg font-extrabold tracking-tight text-zinc-900">minds</span>
          </a>
          <div className="flex items-center gap-2">
            <a
              href="/settings"
              aria-label="설정"
              className="flex min-h-[44px] items-center gap-1 rounded-xl border-2 border-amber-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-700 hover:bg-amber-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-amber-300"
            >
              <span aria-hidden="true">⚙️</span> 설정
            </a>
            {user && (
              <form action="/api/auth/signout" method="post">
                <button
                  aria-label="로그아웃"
                  className="min-h-[44px] rounded-xl border-2 border-amber-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-700 hover:bg-amber-50 focus:ring-4 focus:ring-amber-300 focus:outline-none"
                >
                  로그아웃
                </button>
              </form>
            )}
          </div>
        </div>
      </header>

      {/* 하단 탭에 본문이 가리지 않도록 넉넉한 아래 여백 */}
      <main className="flex-1 pb-28">{children}</main>

      <BottomNav />
    </div>
  );
}
