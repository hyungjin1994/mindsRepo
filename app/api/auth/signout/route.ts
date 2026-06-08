import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function POST() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // No Supabase configured → nothing to sign out of, treat as success.
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json({ ok: true });
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // setAll called from a context that can't set cookies — proxy refreshes the session
        }
      },
    },
  });

  // signOut() clears the Supabase auth cookies via the setAll handler above.
  await supabase.auth.signOut();

  return NextResponse.json({ ok: true });
}
