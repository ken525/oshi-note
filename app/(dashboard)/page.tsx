/**
 * ホームダッシュボード
 * 今日の推しノート（最新記事）を表示
 * 登録した推しごとにタブ切り替え
 */
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { ArticleCard } from "@/components/features/articles/ArticleCard"
import { OshiTabs } from "@/components/features/articles/OshiTabs"
import { EmptyState } from "@/components/features/articles/EmptyState"
import { Loader2, Calendar } from "lucide-react"
import type { Article, Oshi } from "@/types"

export default function DashboardPage() {
  const [oshiList, setOshiList] = useState<Oshi[]>([])
  const [articles, setArticles] = useState<Article[]>([])
  const [selectedOshiId, setSelectedOshiId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [selectedOshiId])

  const fetchData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/login")
        return
      }

      // 推し一覧を取得
      const { data: oshiData, error: oshiError } = await supabase
        .from("oshi")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (oshiError) throw oshiError
      setOshiList((oshiData as Oshi[]) || [])

      // 今日の日付
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      // 記事を取得
      let query = supabase
        .from("articles")
        .select("*")
        .eq("user_id", user.id)
        .gte("published_date", today.toISOString().split("T")[0])
        .lt("published_date", tomorrow.toISOString().split("T")[0])
        .order("created_at", { ascending: false })

      if (selectedOshiId) {
        query = query.eq("oshi_id", selectedOshiId)
      }

      const { data: articlesData, error: articlesError } = await query

      if (articlesError) throw articlesError
      setArticles((articlesData as Article[]) || [])
    } catch (error: any) {
      console.error("Error fetching data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-pink-500" />
      </div>
    )
  }

  const filteredArticles = selectedOshiId
    ? articles.filter((article) => article.oshi_id === selectedOshiId)
    : articles

  const getOshiById = (oshiId: string) => {
    return oshiList.find((oshi) => oshi.id === oshiId)
  }

  return (
    <div>
      {/* ヘッダー */}
      <div className="mb-6">
        <h1 className="mb-4 text-3xl font-bold text-gray-900 dark:text-gray-100">
          今日の推しノート
        </h1>
        <OshiTabs
          oshiList={oshiList}
          selectedOshiId={selectedOshiId}
          onSelect={setSelectedOshiId}
        />
      </div>

      {/* 記事一覧 */}
      {filteredArticles.length === 0 ? (
        <EmptyState
          message="まだ情報がありません"
          icon={<Calendar className="h-10 w-10 text-pink-500 dark:text-pink-400" />}
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredArticles.map((article) => {
            const oshi = getOshiById(article.oshi_id)
            return (
              <div
                key={article.id}
                className="animate-fade-in-up"
                style={{
                  animationDelay: `${filteredArticles.indexOf(article) * 100}ms`,
                }}
              >
                <ArticleCard
                  article={article}
                  oshiName={oshi?.name || "推し"}
                  oshiIconUrl={oshi?.icon_url}
                />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
