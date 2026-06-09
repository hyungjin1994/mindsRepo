import { getOrCreateUser } from "../../lib/auth";
import A11yControls from "../components/A11yControls";
import BottomNav from "../components/BottomNav";

// (app) 그룹 = 어머니 전용 앱 영역. 상단 바 + 본문 + 하단 탭으로 "앱처럼" 감싼다.
//
// 가드: 데이터는 각 API 라우트가 세션으로 보호하므로(미로그인 시 401/빈값), 페이지 셸은
// 로그인 없이도 둘러볼 수 있게 둔다. 이메일 로그인이 실제로 동작하게 설정한 뒤
// 아래 redirect 를 다시 켜면 미로그인 사용자를 /login 으로 보낼 수 있다.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const mapped = await getOrCreateUser().catch(() => null);
  const user = mapped?.prismaUser;

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
            <A11yControls />
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
