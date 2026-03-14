/**
 * 推し一覧ページ
 * 登録した推しの一覧を表示・編集・削除
 */
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { OshiCard } from "@/components/features/oshi/OshiCard"
import { Button } from "@/components/ui"
import { Plus, Loader2 } from "lucide-react"
import type { Oshi } from "@/types"

export default function OshiListPage() {
  const [oshiList, setOshiList] = useState<Oshi[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const fetchOshiList = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/login")
        return
      }

      const { data, error: fetchError } = await supabase
        .from("oshi")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (fetchError) throw fetchError

      setOshiList(data || [])
    } catch (err: any) {
      setError(err.message || "推し一覧の取得に失敗しました")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchOshiList()
  }, [])

  const handleDelete = async (id: string) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const { error: deleteError } = await supabase
        .from("oshi")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id)

      if (deleteError) throw deleteError

      // 一覧を更新
      setOshiList(oshiList.filter((oshi) => oshi.id !== id))
    } catch (err: any) {
      alert(err.message || "削除に失敗しました")
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-pink-500" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 text-red-600 dark:text-red-400">
        {error}
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            推し一覧
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {oshiList.length}名登録中
          </p>
        </div>
        <Link href="/oshi/new">
          <Button
            variant="primary"
            size="lg"
            className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white"
          >
            <Plus className="mr-2 h-5 w-5" />
            新規登録
          </Button>
        </Link>
      </div>

      {oshiList.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-pink-100 dark:bg-pink-900/30">
            <Plus className="h-8 w-8 text-pink-500 dark:text-pink-400" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
            まだ推しが登録されていません
          </h3>
          <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
            最初の推しを登録して、推しノートを始めましょう！
          </p>
          <Link href="/oshi/new">
            <Button
              variant="primary"
              size="lg"
              className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white"
            >
              <Plus className="mr-2 h-5 w-5" />
              推しを登録
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {oshiList.map((oshi) => (
            <OshiCard key={oshi.id} oshi={oshi} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  )
}
