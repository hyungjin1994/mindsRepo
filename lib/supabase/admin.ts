import { createClient } from "@supabase/supabase-js";

// 서버 전용 관리자(service-role) 클라이언트. Storage 업로드 등 RLS 를 우회해야 하는
// 작업에만 사용한다. 절대 클라이언트(브라우저)로 노출하지 말 것.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase service role not configured");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
