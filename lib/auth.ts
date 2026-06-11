import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { prisma } from "./prisma";

// Helper: get server supabase user and ensure corresponding Prisma User exists.
// IMPORTANT: this is called from the root layout on every render, so it must
// NEVER throw — any failure (missing env, network error, DB down) returns null
// and the app falls back to a logged-out view instead of crashing.
export async function getOrCreateUser() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // No Supabase configured → treat as logged out.
  if (!supabaseUrl || !supabaseAnonKey) return null;

  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {
          /* noop — refreshed via middleware/proxy */
        },
      },
    });

    const {
      data: { user } = {},
    } = await supabase.auth.getUser();

    if (!user) return null;

    // Upsert Prisma user mirroring Supabase user id
    const u = await prisma.user.upsert({
      where: { id: user.id as string },
      update: {
        email: user.email ?? undefined,
        // 회원가입 때 받은 이름(metadata.full_name)이 있으면 그것으로 동기화.
        // 없으면 기존 이름을 덮어쓰지 않는다 (설정에서 바꾼 이름이 유지되도록).
        name: (user.user_metadata?.full_name as string) ?? undefined,
      },
      create: {
        id: user.id as string,
        email: user.email ?? `unknown+${user.id}@example.com`,
        name: (user.user_metadata?.full_name as string) ?? undefined,
      },
    });

    return { supabaseUser: user, prismaUser: u };
  } catch (err) {
    // Network error to Supabase, DB unreachable, etc. — degrade to logged out.
    console.warn("[auth] getOrCreateUser failed, treating as logged out:", (err as Error)?.message);
    return null;
  }
}
