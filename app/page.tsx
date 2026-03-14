/**
 * トップページ
 * 認証状態に応じてランディングページまたはダッシュボードを表示
 */
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui'

// 動的レンダリングを強制（cookies()を使用するため）
export const dynamic = 'force-dynamic'

export default async function Home() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // 認証済みユーザーはダッシュボードにリダイレクト
    if (user) {
      redirect('/oshi')
    }
  } catch (error) {
    // 環境変数が設定されていない場合など、エラーが発生してもランディングページを表示
    console.error('Supabase初期化エラー:', error)
  }

  // 未認証ユーザー向けのランディングページ
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-pink-50 via-purple-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <main className="mx-auto max-w-4xl px-4 py-16 text-center">
        <h1 className="mb-4 bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-5xl font-bold text-transparent">
          私だけの推しノート
        </h1>
        <p className="mb-8 text-xl text-gray-600 dark:text-gray-400">
          あなただけの推しノートを作成・管理するアプリケーション
        </p>
        <div className="flex justify-center gap-4">
          <Link href="/login">
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white"
            >
              ログイン
            </Button>
          </Link>
          <Link href="/signup">
            <Button variant="outline" size="lg">
              新規登録
            </Button>
          </Link>
        </div>
      </main>
    </div>
  )
}
