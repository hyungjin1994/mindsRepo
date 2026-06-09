import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

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

// 루트 레이아웃은 문서 골격·폰트·전역 스타일만 담당한다.
// 어머니용 앱 화면의 상단바/하단탭은 app/(app)/layout.tsx 가 감싼다.
// 로그인·자식용 매직링크 화면은 이 골격만 쓰므로 군더더기 없이 보인다.
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-screen min-h-full flex-col">{children}</body>
    </html>
  );
}
