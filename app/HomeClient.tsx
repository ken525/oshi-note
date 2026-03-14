/**
 * トップページのクライアントコンポーネント
 * リンクのクリックを確実に動作させるため
 */
"use client"

import { useRouter } from 'next/navigation'

export function HomeClient() {
  const router = useRouter()

  const handleLoginClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    router.push('/login')
  }

  const handleSignupClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    router.push('/signup')
  }

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
          <a
            href="/login"
            onClick={handleLoginClick}
            className="inline-flex items-center justify-center px-6 py-3 text-lg font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white focus:ring-pink-500 cursor-pointer"
          >
            ログイン
          </a>
          <a
            href="/signup"
            onClick={handleSignupClick}
            className="inline-flex items-center justify-center px-6 py-3 text-lg font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-500 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800 cursor-pointer"
          >
            新規登録
          </a>
        </div>
      </main>
    </div>
  )
}
