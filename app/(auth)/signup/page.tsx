/**
 * サインアップページ
 * 新規ユーザー登録ページ
 */
import Link from "next/link"
import { SignupForm } from "@/components/features/auth/SignupForm"

export default function SignupPage() {
  return (
    <div className="rounded-2xl bg-white dark:bg-gray-800 p-8 shadow-xl border border-purple-100 dark:border-gray-700">
      <h2 className="mb-2 text-2xl font-bold text-gray-900 dark:text-gray-100">
        新規登録
      </h2>
      <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
        アカウントを作成して、推しノートを始めましょう！
      </p>
      
      <SignupForm />

      <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
        既にアカウントをお持ちの方は{" "}
        <Link
          href="/login"
          className="font-medium text-purple-500 hover:text-purple-600 dark:text-purple-400 dark:hover:text-purple-300 transition-colors"
        >
          ログイン
        </Link>
      </p>
    </div>
  )
}
