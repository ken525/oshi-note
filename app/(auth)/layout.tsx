/**
 * 認証ページ用レイアウト
 * ログイン・サインアップページの共通レイアウト
 * アイドルファン向けのかわいくてポップなデザイン
 */
import Link from "next/link"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-pink-50 via-purple-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-block">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
              私だけの推しノート
            </h1>
          </Link>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            あなただけの推しノートを作成・管理
          </p>
        </div>
        {children}
      </div>
    </div>
  )
}
