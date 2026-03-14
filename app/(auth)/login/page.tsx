/**
 * ログインページ
 * メール認証とGoogle OAuthログインを提供
 */
import Link from "next/link"
import { LoginForm } from "@/components/features/auth/LoginForm"

export default function LoginPage() {
  return (
    <div className="rounded-2xl bg-white dark:bg-gray-800 p-8 shadow-xl border border-pink-100 dark:border-gray-700">
      <h2 className="mb-2 text-2xl font-bold text-gray-900 dark:text-gray-100">
        ログイン
      </h2>
      <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
        アカウントにログインして、推しノートを始めましょう！
      </p>
      
      <LoginForm />

      <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
        アカウントをお持ちでない方は{" "}
        <Link
          href="/signup"
          className="font-medium text-pink-500 hover:text-pink-600 dark:text-pink-400 dark:hover:text-pink-300 transition-colors"
        >
          新規登録
        </Link>
      </p>
    </div>
  )
}
