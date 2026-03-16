/**
 * 推し別記事一覧ページ
 * /oshi/[id]/articles
 */
"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { ArticleCard } from "@/components/features/articles/ArticleCard"
import { Loader2, ArrowLeft, RefreshCw } from "lucide-react"
import type { Article, Oshi } from "@/types"

export default function OshiArticlesPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  const [oshi, setOshi] = useState<Oshi | null>(null)
  const [articles, setArticles] = useState<Article[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generateError, setGenerateError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const generateCalledRef = useRef(false)

  const oshiId = Array.isArray(params.id) ? params.id[0] : params.id

  const fetchArticles = useCallback(async (): Promise<Article[]> => {
    if (!oshiId) return []
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return []

    const { data } = await supabase
      .from("articles")
      .select("*")
      .eq("oshi_id", oshiId)
      .eq("user_id", user.id)
      .order("published_date", { ascending: false })
      .order("created_at", { ascending: false })

    return (data as Article[]) || []
  }, [oshiId, supabase])

  const fetchData = useCallback(async () => {
    if (!oshiId) return
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/login")
        return
      }

      const { data: oshiData, error: oshiError } = await supabase
        .from("oshi")
        .select("*")
        .eq("id", oshiId)
        .eq("user_id", user.id)
        .single()

      if (oshiError || !oshiData) {
        setError("推しが見つかりません")
        setIsLoading(false)
        return
      }

      setOshi(oshiData as Oshi)

      const fetched = await fetchArticles()
      setArticles(fetched)
    } catch (err: any) {
      setError(err.message || "データの取得に失敗しました")
    } finally {
      setIsLoading(false)
    }
  }, [oshiId, router, supabase, fetchArticles])

  // 初回ロード
  useEffect(() => {
    fetchData()
  }, [fetchData])

  // 記事が0件のとき、生成APIを一度だけ呼び出す
  useEffect(() => {
    if (isLoading) return
    if (articles.length > 0) return
    if (generateCalledRef.current) return
    if (!oshiId) return

    generateCalledRef.current = true
    setIsGenerating(true)
    setGenerateError(null)

    ;(async () => {
      try {
        const res = await fetch("/api/articles/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ oshiId }),
        })
        const json = await res.json()

        if (!res.ok) {
          // 既に記事がある場合はリフレッシュ
          if (res.status === 200) {
            const fetched = await fetchArticles()
            setArticles(fetched)
          } else {
            setGenerateError(json.error || "記事の生成に失敗しました")
          }
        } else {
          // 生成完了後に記事を再取得
          const fetched = await fetchArticles()
          setArticles(fetched)
          if (fetched.length === 0) {
            setGenerateError("記事の生成に失敗しました。しばらくして再度お試しください。")
          }
        }
      } catch (err: any) {
        setGenerateError(err.message || "記事の生成に失敗しました")
      } finally {
        setIsGenerating(false)
      }
    })()
  }, [isLoading, articles.length, oshiId, fetchArticles])

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-pink-500" />
        <p className="text-gray-600 dark:text-gray-400">読み込み中...</p>
      </div>
    )
  }

  if (error || !oshi) {
    return (
      <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4 text-red-600 dark:text-red-400">
        {error || "推しが見つかりません"}
      </div>
    )
  }

  return (
    <div>
      <Link
        href="/oshi"
        className="mb-6 inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-pink-500 dark:hover:text-pink-400 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        推し一覧に戻る
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          {oshi.name} のノート
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          {articles.length}件の記事
        </p>
      </div>

      {isGenerating ? (
        <div className="flex min-h-[300px] flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-pink-200 dark:border-pink-800 bg-pink-50 dark:bg-pink-900/20 p-12">
          <Loader2 className="h-10 w-10 animate-spin text-pink-500" />
          <p className="text-gray-700 dark:text-gray-300 font-medium">
            はじめての記事を生成中...
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            1〜2分ほどかかることがあります。このままお待ちください。
          </p>
        </div>
      ) : generateError ? (
        <div className="flex min-h-[300px] flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-12">
          <p className="text-red-600 dark:text-red-400 text-sm">{generateError}</p>
          <button
            onClick={() => {
              generateCalledRef.current = false
              setGenerateError(null)
              setArticles([])
            }}
            className="mt-2 inline-flex items-center gap-2 rounded-lg bg-pink-500 px-4 py-2 text-sm font-medium text-white hover:bg-pink-600 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            再試行
          </button>
        </div>
      ) : articles.length === 0 ? (
        <div className="flex min-h-[300px] flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-12">
          <p className="text-gray-600 dark:text-gray-400">まだ記事がありません</p>
          <button
            onClick={() => {
              generateCalledRef.current = false
              setGenerateError(null)
            }}
            className="mt-2 inline-flex items-center gap-2 rounded-lg bg-pink-500 px-4 py-2 text-sm font-medium text-white hover:bg-pink-600 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            記事を生成する
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <ArticleCard
              key={article.id}
              article={article}
              oshiName={oshi.name}
              oshiIconUrl={oshi.icon_url}
            />
          ))}
        </div>
      )}
    </div>
  )
}
