/**
 * Supabase サービスロールクライアント（サーバー専用・RLS をバイパス）
 * Cron やバッチ処理で全ユーザーの oshi / raw_posts / articles にアクセスする際に使用する。
 * 絶対にクライアントや公開 API に渡さないこと。
 */
import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"

export function createServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error(
      "Cron / バッチ用に SUPABASE_SERVICE_ROLE_KEY と NEXT_PUBLIC_SUPABASE_URL を設定してください。"
    )
  }

  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
