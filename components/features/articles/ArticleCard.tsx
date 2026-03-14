/**
 * 記事カードコンポーネント
 * グラデーション背景 + アイコン + タイトル + ハイライトプレビュー
 */
"use client"

import Link from "next/link"
import Image from "next/image"
import { format } from "date-fns"
import { ja } from "date-fns/locale"
import { memo, useMemo } from "react"
import { Sparkles, Calendar } from "lucide-react"
import type { Article } from "@/types"

interface ArticleCardProps {
  article: Article
  oshiName: string
  oshiIconUrl?: string | null
}

export const ArticleCard = memo(function ArticleCard({
  article,
  oshiName,
  oshiIconUrl,
}: ArticleCardProps) {
  const highlights = useMemo(() => {
    return Array.isArray(article.highlights)
      ? article.highlights.filter((h): h is string => typeof h === "string")
      : []
  }, [article.highlights])

  const publishedDate = useMemo(() => {
    return article.published_date
      ? new Date(article.published_date)
      : new Date(article.created_at)
  }, [article.published_date, article.created_at])

  const formattedDate = useMemo(() => {
    return format(publishedDate, "yyyy年M月d日", { locale: ja })
  }, [publishedDate])

  return (
    <Link href={`/articles/${article.id}`}>
      <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-pink-500 via-purple-500 to-pink-600 p-6 shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl dark:from-pink-600 dark:via-purple-600 dark:to-pink-700">
        {/* 背景グラデーションオーバーレイ */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        {/* コンテンツ */}
        <div className="relative">
          {/* ヘッダー */}
          <div className="mb-4 flex items-start justify-between">
            <div className="flex items-center gap-3">
              {oshiIconUrl ? (
                <div className="h-12 w-12 overflow-hidden rounded-full border-2 border-white/30">
                  <Image
                    src={oshiIconUrl}
                    alt={oshiName}
                    width={48}
                    height={48}
                    className="h-full w-full object-cover"
                    unoptimized
                  />
                </div>
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
              )}
              <div>
                <h3 className="text-lg font-bold text-white">{oshiName}</h3>
                <div className="flex items-center gap-1 text-sm text-white/80">
                  <Calendar className="h-3 w-3" />
                  <time dateTime={publishedDate.toISOString()}>
                    {formattedDate}
                  </time>
                </div>
              </div>
            </div>
          </div>

          {/* タイトル */}
          <h2 className="mb-3 text-2xl font-bold text-white line-clamp-2">
            {article.title}
          </h2>

          {/* ハイライト */}
          {highlights.length > 0 && (
            <div className="mb-4 space-y-2">
              {highlights.slice(0, 3).map((highlight, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 rounded-lg bg-white/10 backdrop-blur-sm p-2 text-sm text-white/90"
                >
                  <span className="mt-0.5 text-pink-200">✨</span>
                  <span className="line-clamp-1">{String(highlight)}</span>
                </div>
              ))}
            </div>
          )}

          {/* フッター */}
          <div className="flex items-center justify-between text-sm text-white/70">
            <span className="flex items-center gap-1">
              <Sparkles className="h-4 w-4" />
              推しノート
            </span>
            <span className="group-hover:translate-x-1 transition-transform">
              →
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
})
