/**
 * OAuthコールバックハンドラ
 * SupabaseのOAuth認証（Google等）後のコールバックを処理
 */
import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const next = requestUrl.searchParams.get("next") ?? "/"

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data?.user?.id) {
      await supabase
        .from('profiles')
        .update({ last_active_at: new Date().toISOString() })
        .eq('id', data.user.id)
      return NextResponse.redirect(new URL(next, request.url))
    }
  }

  // エラー時はログインページにリダイレクト
  return NextResponse.redirect(new URL("/login?error=auth_failed", request.url))
}
