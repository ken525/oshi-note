/**
 * アーカイブページ
 * カレンダーUIで日付選択、選択した日付の記事一覧表示、キーワード検索
 */
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import Calendar from "react-calendar"
import "react-calendar/dist/Calendar.css"
import { ArticleCard } from "@/components/features/articles/ArticleCard"
import { EmptyState } from "@/components/features/articles/EmptyState"
import { Input, Button } from "@/components/ui"
import { Loader2, Search, Calendar as CalendarIcon, Lock } from "lucide-react"
import { checkArchiveAccessClient } from "@/lib/subscription-client"
import Link from "next/link"
import type { Article, Oshi } from "@/types"

type ValuePiece = Date | null
type Value = ValuePiece | [ValuePiece, ValuePiece]

export default function ArchivePage() {
  const [selectedDate, setSelectedDate] = useState<Value>(new Date())
  const [articles, setArticles] = useState<Article[]>([])
  const [oshiList, setOshiList] = useState<Oshi[]>([])
  const [searchKeyword, setSearchKeyword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [accessCheck, setAccessCheck] = useState<{
    canAccess: boolean
    reason?: string
  } | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchOshiList()
  }, [])

  useEffect(() => {
    if (selectedDate && selectedDate instanceof Date) {
      checkAccess()
      fetchArticles()
    }
  }, [selectedDate])

  const checkAccess = async () => {
    if (!selectedDate || !(selectedDate instanceof Date)) return
    
    const result = await checkArchiveAccessClient(selectedDate)
    setAccessCheck(result)
  }

  const fetchOshiList = async () => {
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
        .eq("user_id", user.id)

      if (!oshiError && oshiData) {
        setOshiList((oshiData as Oshi[]) || [])
      }
    } catch (error) {
      console.error("Error fetching oshi list:", error)
    }
  }

  const fetchArticles = async () => {
    if (!selectedDate || !(selectedDate instanceof Date)) return

    setIsLoading(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/login")
        return
      }

      const dateStr = selectedDate.toISOString().split("T")[0]

      const { data: articlesData, error: articlesError } = await supabase
        .from("articles")
        .select("*")
        .eq("user_id", user.id)
        .eq("published_date", dateStr)
        .order("created_at", { ascending: false })

      if (articlesError) throw articlesError
      setArticles((articlesData as Article[]) || [])
    } catch (error: any) {
      console.error("Error fetching articles:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getOshiById = (oshiId: string) => {
    return oshiList.find((oshi) => oshi.id === oshiId)
  }

  // キーワード検索でフィルタリング
  const filteredArticles = articles.filter((article) => {
    if (!searchKeyword) return true
    const keyword = searchKeyword.toLowerCase()
    const highlights = Array.isArray(article.highlights) ? article.highlights : []
    return (
      article.title.toLowerCase().includes(keyword) ||
      article.content.toLowerCase().includes(keyword) ||
      highlights.some((h) => {
        if (typeof h === 'string') {
          return h.toLowerCase().includes(keyword)
        }
        return false
      })
    )
  })

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold text-gray-900 dark:text-gray-100">
        アーカイブ
      </h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* カレンダー */}
        <div className="lg:col-span-1">
          <div className="rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
              <CalendarIcon className="h-5 w-5 text-pink-500 dark:text-pink-400" />
              日付を選択
            </h2>
            <Calendar
              onChange={setSelectedDate}
              value={selectedDate}
              className="w-full"
              aria-label="日付を選択"
              tileClassName={({ date, view }) => {
                if (view === "month") {
                  const dateStr = date.toISOString().split("T")[0]
                  const hasArticle = articles.some(
                    (article) => article.published_date === dateStr
                  )
                  if (hasArticle) {
                    return "bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 font-semibold"
                  }
                }
                return ""
              }}
            />
          </div>
        </div>

        {/* 記事一覧 */}
        <div className="lg:col-span-2">
          {/* 検索バー */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                placeholder="キーワードで検索..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* 選択した日付 */}
          {selectedDate && selectedDate instanceof Date && (
            <div className="mb-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {selectedDate.toLocaleDateString("ja-JP", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
                の記事
              </p>
              {accessCheck && !accessCheck.canAccess && (
                <div className="mt-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4">
                  <div className="flex items-start gap-3">
                    <Lock className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                        {accessCheck.reason}
                      </p>
                      <Link href="/settings/plan" className="mt-2 inline-block">
                        <Button
                          variant="primary"
                          size="sm"
                          className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white"
                        >
                          スタンダードプランにアップグレード
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 記事一覧 */}
          {accessCheck && !accessCheck.canAccess ? (
            <EmptyState
              message={accessCheck.reason || "この日のアーカイブにアクセスできません"}
              icon={<Lock className="h-10 w-10 text-yellow-500 dark:text-yellow-400" />}
            />
          ) : isLoading ? (
            <div className="flex min-h-[400px] items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-pink-500" />
            </div>
          ) : filteredArticles.length === 0 ? (
            <EmptyState
              message={
                searchKeyword
                  ? "検索結果が見つかりませんでした"
                  : "この日の記事はありません"
              }
              icon={<CalendarIcon className="h-10 w-10 text-pink-500 dark:text-pink-400" />}
            />
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
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
      </div>
    </div>
  )
}
