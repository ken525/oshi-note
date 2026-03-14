/**
 * ダッシュボード用レイアウト
 * ログイン後のメイン画面の共通レイアウト
 */
import Link from "next/link"
import { LogoutButton } from "@/components/features/auth/LogoutButton"
import { PushNotificationButton } from "@/components/features/notifications/PushNotificationButton"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <nav className="border-b border-pink-100 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center" aria-label="ホームに戻る">
              <h1 className="text-xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
                私だけの推しノート
              </h1>
            </Link>
            <div className="flex items-center gap-4">
              <Link
                href="/archive"
                className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-pink-500 dark:hover:text-pink-400 transition-colors"
                aria-label="アーカイブページへ移動"
              >
                アーカイブ
              </Link>
              <Link
                href="/settings/plan"
                className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-pink-500 dark:hover:text-pink-400 transition-colors"
                aria-label="プラン管理ページへ移動"
              >
                プラン
              </Link>
              <div className="hidden sm:block">
                <PushNotificationButton />
              </div>
              <LogoutButton />
            </div>
          </div>
        </div>
      </nav>
      <main id="main-content" className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8" role="main">
        {children}
      </main>
    </div>
  )
}
