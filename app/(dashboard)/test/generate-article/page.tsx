/**
 * テスト用: 記事生成APIの結果を記事UIでプレビューするページ
 * アクセス: http://localhost:3000/test/generate-article
 */
"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArticleDetailClient } from "@/app/(dashboard)/articles/[id]/ArticleDetailClient"
import { Loader2, ArrowLeft, AlertCircle } from "lucide-react"
import type { Article, Oshi } from "@/types"

type ApiArticle = {
  title: string
  highlights?: string[] | null
  content: string
  source_links?: Array<{ label?: string; url: string }> | null
}

export default function TestGenerateArticlePage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [article, setArticle] = useState<Article | null>(null)
  const [oshi, setOshi] = useState<Oshi | null>(null)

  useEffect(() => {
    let cancelled = false
    async function fetchArticle() {
      try {
        const res = await fetch("/api/test/generate-article", { credentials: "include" })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          setError(data.message || `エラー: ${res.status}`)
          setLoading(false)
          return
        }
        const data = await res.json()
        if (!data.success || !data.article) {
          setError("記事の取得に失敗しました")
          setLoading(false)
          return
        }
        if (cancelled) return
        const a = data.article as ApiArticle
        const now = new Date().toISOString()
        const articleForUi: Article = {
          id: "preview",
          user_id: "",
          oshi_id: "",
          title: a.title ?? "",
          content: a.content ?? "",
          highlights: a.highlights ?? null,
          source_links: a.source_links ?? null,
          published_date: null,
          created_at: now,
        }
        setArticle(articleForUi)
        setOshi(
          data.oshi_name
            ? ({
                id: "preview-oshi",
                user_id: "",
                name: data.oshi_name,
                group_name: null,
                keywords: [],
                icon_url: null,
                created_at: now,
              } as Oshi)
            : null
        )
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "通信エラー")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchArticle()
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-pink-500" />
        <p className="text-gray-600 dark:text-gray-400">記事を生成しています…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-6">
        <div className="mb-4 flex items-center gap-2 text-red-700 dark:text-red-300">
          <AlertCircle className="h-5 w-5" />
          <span className="font-medium">プレビューできません</span>
        </div>
        <p className="mb-4 text-red-600 dark:text-red-400">{error}</p>
        <Link
          href="/oshi"
          className="inline-flex items-center gap-2 text-pink-600 dark:text-pink-400 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          ダッシュボードに戻る
        </Link>
      </div>
    )
  }

  if (!article) return null

  const currentUrl =
    typeof window !== "undefined" ? window.location.href : "/test/generate-article"

  return (
    <div>
      <Link
        href="/oshi"
        className="mb-6 inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-pink-500 dark:hover:text-pink-400 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        ダッシュボードに戻る
      </Link>
      <div className="mb-4 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 px-4 py-2 text-sm text-amber-800 dark:text-amber-200">
        これはテスト用プレビューです。記事は保存されていません。
      </div>
      <ArticleDetailClient
        article={article}
        oshi={oshi}
        currentUrl={currentUrl}
      />
    </div>
  )
}
