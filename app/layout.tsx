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
      <body className="min-h-full flex min-h-screen flex-col">
        <header className="border-b bg-white px-4 py-3">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
            <a href="/" className="text-lg font-semibold" aria-label="minds 홈">
              minds
            </a>
            <div className="flex flex-wrap items-center gap-3">
              <A11yControls />
              {user ? (
                <div className="flex items-center gap-3">
                  <div className="text-base">{user.name ?? user.email}</div>
                  <form action="/api/auth/signout" method="post">
                    <button
                      aria-label="로그아웃"
                      className="min-h-[56px] rounded border px-4 py-3 text-base hover:bg-zinc-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      로그아웃
                    </button>
                  </form>
                </div>
              ) : (
                <a
                  href="/login"
                  aria-label="로그인"
                  className="inline-flex min-h-[56px] items-center rounded border px-4 py-3 text-base hover:bg-zinc-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
