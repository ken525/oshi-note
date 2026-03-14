/**
 * 空状態UIコンポーネント
 */
"use client"

import { Sparkles, Calendar } from "lucide-react"

interface EmptyStateProps {
  message?: string
  icon?: React.ReactNode
}

export function EmptyState({
  message = "まだ情報がありません",
  icon,
}: EmptyStateProps) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-pink-200 dark:border-pink-800 bg-gradient-to-br from-pink-50/50 to-purple-50/50 dark:from-pink-900/10 dark:to-purple-900/10 p-12 text-center">
      <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-pink-200 to-purple-200 dark:from-pink-800 dark:to-purple-800">
        {icon || <Sparkles className="h-10 w-10 text-pink-500 dark:text-pink-400" />}
      </div>
      <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-gray-100">
        {message}
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        情報が収集され次第、記事が自動生成されます
      </p>
    </div>
  )
}
