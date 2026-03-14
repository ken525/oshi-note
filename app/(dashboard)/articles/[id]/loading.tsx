/**
 * 記事詳細ページのローディングUI
 */
import { Loader2 } from "lucide-react"

export default function Loading() {
  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-pink-500" />
        <p className="text-sm text-gray-600 dark:text-gray-400">記事を読み込み中...</p>
      </div>
    </div>
  )
}
