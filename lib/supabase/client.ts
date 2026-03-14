/**
 * Supabaseクライアント（ブラウザ用）
 * ブラウザ側でSupabaseにアクセスする際に使用
 */
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Supabaseの環境変数が設定されていません。NEXT_PUBLIC_SUPABASE_URLとNEXT_PUBLIC_SUPABASE_ANON_KEYを確認してください。'
    )
  }

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)
}
