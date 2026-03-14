/**
 * 記事詳細ページのエラーUI
 */
"use client"

import { useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui"
import { AlertCircle, ArrowLeft } from "lucide-react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Article detail error:", error)
  }, [error])

  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <div className="max-w-md rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-6 text-center">
        <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-500 dark:text-red-400" />
        <h2 className="mb-2 text-xl font-semibold text-red-900 dark:text-red-100">
          記事の読み込みに失敗しました
        </h2>
        <p className="mb-4 text-sm text-red-700 dark:text-red-300">
          {error.message || "記事が見つからないか、読み込めませんでした"}
        </p>
        <div className="flex gap-3 justify-center">
          <Link href="/">
            <Button variant="outline" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              ダッシュボードに戻る
            </Button>
          </Link>
          <Button
            variant="primary"
            onClick={reset}
            className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white"
          >
            再試行
          </Button>
        </div>
      </div>
    </div>
  )
}
