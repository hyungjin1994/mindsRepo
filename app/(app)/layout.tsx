import { redirect } from "next/navigation";
import { getOrCreateUser } from "../../lib/auth";

// (app) 그룹 = 어머니 전용 보호 영역 (게임/약/일정/운동/포인트/가족피드 등).
// Supabase 가 실제로 설정돼 있으면 로그인하지 않은 사용자를 /login 으로 보낸다.
// 단, env 가 placeholder/미설정인 로컬 개발에서는 가드를 건너뛰어 개발을 막지 않는다.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseConfigured = !!url && !url.includes("placeholder");

  if (supabaseConfigured) {
    const mapped = await getOrCreateUser();
    if (!mapped) {
      redirect("/login");
    }
  }

  return <>{children}</>;
}
