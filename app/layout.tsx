import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { getOrCreateUser } from "../lib/auth";
import A11yControls from "./components/A11yControls";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "minds — 치매 예방",
  description: "어머니를 위한 치매 예방 인지 게임과 건강 관리 앱",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const mapped = await getOrCreateUser();
  const user = mapped?.prismaUser;

  return (
    <html lang="ko" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-screen min-h-full flex-col">
        <header className="sticky top-0 z-20 border-b border-amber-100/80 bg-white/85 px-4 py-3 backdrop-blur">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
            <a href="/" className="flex items-center gap-2.5" aria-label="minds 홈">
              <span
                aria-hidden="true"
                className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-400 text-2xl shadow-sm"
              >
                🧠
              </span>
              <span className="flex flex-col leading-tight">
                <span className="text-xl font-extrabold tracking-tight text-zinc-900">minds</span>
                <span className="text-xs font-medium text-amber-700">매일 두뇌 건강</span>
              </span>
            </a>
            <div className="flex flex-wrap items-center gap-3">
              <A11yControls />
              {user ? (
                <div className="flex items-center gap-3">
                  <div className="text-base font-medium text-zinc-700">{user.name ?? user.email}</div>
                  <form action="/api/auth/signout" method="post">
                    <button
                      aria-label="로그아웃"
                      className="min-h-[56px] rounded-2xl border-2 border-amber-200 bg-white px-5 py-3 text-base font-semibold text-zinc-800 hover:bg-amber-50 focus:ring-4 focus:ring-amber-300 focus:outline-none"
                    >
                      로그아웃
                    </button>
                  </form>
                </div>
              ) : (
                <a
                  href="/login"
                  aria-label="로그인"
                  className="inline-flex min-h-[56px] items-center rounded-2xl bg-amber-400 px-6 py-3 text-base font-bold text-zinc-900 shadow-sm hover:bg-amber-300 focus:ring-4 focus:ring-amber-300 focus:outline-none"
                >
                  로그인
                </a>
              )}
            </div>
          </div>
        </header>
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
