/**
 * 記事詳細ページのクライアントコンポーネント
 */
"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { format } from "date-fns"
import { ja } from "date-fns/locale"
import { createClient } from "@/lib/supabase/client"
import { ArticleContent } from "@/components/features/articles/ArticleContent"
import { ShareButton } from "@/components/features/share/ShareButton"
import { Loader2, ArrowLeft, Calendar, ExternalLink, Sparkles } from "lucide-react"
import type { Article, Oshi } from "@/types"

interface ArticleDetailClientProps {
  article: Article
  oshi: Oshi | null
  currentUrl: string
}

export function ArticleDetailClient({
  article,
  oshi,
  currentUrl,
}: ArticleDetailClientProps) {
  const highlights = useMemo(() => {
    return Array.isArray(article.highlights)
      ? article.highlights.filter((h): h is string => typeof h === 'string')
      : []
  }, [article.highlights])

  const sourceLinks = useMemo(() => {
    return Array.isArray(article.source_links)
      ? article.source_links.filter((link): link is { label: string; url: string } => {
          return (
            link !== null &&
            typeof link === 'object' &&
            'url' in link &&
            typeof (link as any).url === 'string'
          )
        })
      : []
  }, [article.source_links])

  const publishedDate = useMemo(() => {
    return article.published_date
      ? new Date(article.published_date)
      : new Date(article.created_at)
  }, [article.published_date, article.created_at])

  const formattedDate = useMemo(() => {
    return format(publishedDate, "yyyy年M月d日", { locale: ja })
  }, [publishedDate])

  return (
    <div>
      {/* 戻るボタン */}
      <Link
        href="/oshi"
        className="mb-6 inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-pink-500 dark:hover:text-pink-400 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        ダッシュボードに戻る
      </Link>

      {/* ヘッダー */}
      <div className="mb-8">
        <div className="mb-4 flex items-center gap-3">
          {oshi?.icon_url ? (
            <div className="h-12 w-12 overflow-hidden rounded-full border-2 border-pink-200 dark:border-pink-800">
              <Image
                src={oshi.icon_url}
                alt={oshi.name}
                width={48}
                height={48}
                className="h-full w-full object-cover"
                unoptimized
              />
            </div>
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-pink-200 to-purple-200 dark:from-pink-800 dark:to-purple-800">
              <Sparkles className="h-6 w-6 text-pink-500 dark:text-pink-400" />
            </div>
          )}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {oshi?.name || "推し"}
            </h2>
            <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
              <Calendar className="h-3 w-3" />
              <time dateTime={publishedDate.toISOString()}>
                {formattedDate}
              </time>
            </div>
          </div>
        </div>

        <h1 className="mb-4 text-4xl font-bold text-gray-900 dark:text-gray-100">
          {article.title}
        </h1>

        <div className="flex items-center gap-4">
          <ShareButton title={article.title} url={currentUrl} oshiName={oshi?.name} />
        </div>
      </div>

      {/* ハイライトセクション */}
      {highlights.length > 0 && (
        <div className="mb-8 rounded-2xl bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 p-6 border border-pink-200 dark:border-pink-800">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
            <Sparkles className="h-5 w-5 text-pink-500 dark:text-pink-400" />
            ハイライト
          </h3>
          <ul className="space-y-2">
            {highlights.map((highlight, index) => (
              <li
                key={index}
                className="flex items-start gap-2 text-gray-700 dark:text-gray-300"
              >
                <span className="mt-1 text-pink-500 dark:text-pink-400">✨</span>
                <span>{String(highlight)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 記事本文 */}
      <div className="mb-8 rounded-2xl bg-white dark:bg-gray-800 p-8 shadow-lg border border-gray-200 dark:border-gray-700">
        <ArticleContent content={article.content} />
      </div>

      {/* ソースリンク */}
      {sourceLinks.length > 0 && (
        <div className="rounded-2xl bg-gray-50 dark:bg-gray-900 p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
            <ExternalLink className="h-5 w-5 text-pink-500 dark:text-pink-400" />
            情報ソース
          </h3>
          <ul className="space-y-2">
            {sourceLinks.map((link, index) => {
              const url = typeof link === 'object' && 'url' in link ? link.url : ''
              const label = typeof link === 'object' && 'label' in link ? link.label : url
              return (
                <li key={index}>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-pink-600 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-300 transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span>{label || url}</span>
                  </a>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
