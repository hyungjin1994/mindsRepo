import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Supabase 세션을 매 요청마다 새로고침해 쿠키를 최신으로 유지한다.
// (Next.js 16 proxy 컨벤션 — 구 middleware) 어머니가 한 번 로그인하면 오래 유지되도록.
// Supabase 미설정/네트워크 오류에도 절대 앱을 막지 않는다.
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return response;

  try {
    const supabase = createServerClient(url, key, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    });

    // getUser() 가 토큰을 검증·갱신하고 setAll 로 새 쿠키를 내려준다.
    await supabase.auth.getUser();
  } catch {
    // 네트워크 오류 등 — 세션 갱신만 건너뛰고 요청은 그대로 진행.
  }

  return response;
}

export const config = {
  // 정적 자산·이미지 요청은 제외하고 실행.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)"],
};
