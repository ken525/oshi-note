/**
 * トップページ
 * 認証状態に応じてランディングページまたはダッシュボードを表示
 */
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { HomeClient } from './HomeClient'

// 動的レンダリングを強制（cookies()を使用するため）
export const dynamic = 'force-dynamic'

export default async function Home() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // 認証済みユーザーは記事一覧ページ（ダッシュボード）にリダイレクト
    if (user) {
      redirect('/')
    }
  } catch (error) {
    // 環境変数が設定されていない場合など、エラーが発生してもランディングページを表示
    console.error('Supabase初期化エラー:', error)
  }

  // 未認証ユーザー向けのランディングページ
  return <HomeClient />
}
