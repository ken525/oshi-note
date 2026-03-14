/**
 * 推し編集ページ
 */
"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { OshiForm } from "@/components/features/oshi/OshiForm"
import { Loader2 } from "lucide-react"
import type { Oshi } from "@/types"

export default function EditOshiPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  const [oshi, setOshi] = useState<Oshi | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchOshi = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          router.push("/login")
          return
        }

        const oshiId = Array.isArray(params.id) ? params.id[0] : params.id
        if (!oshiId) {
          setError("推しIDが無効です")
          setIsLoading(false)
          return
        }

        const { data, error: fetchError } = await supabase
          .from("oshi")
          .select("*")
          .eq("id", oshiId)
          .eq("user_id", user.id)
          .single()

        if (fetchError) throw fetchError

        if (!data) {
          setError("推しが見つかりません")
          return
        }

        setOshi(data)
      } catch (err: any) {
        setError(err.message || "推しの取得に失敗しました")
      } finally {
        setIsLoading(false)
      }
    }

    if (params.id) {
      fetchOshi()
    }
  }, [params.id, router, supabase])

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-pink-500" />
      </div>
    )
  }

  if (error || !oshi) {
    return (
      <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 text-red-600 dark:text-red-400">
        {error || "推しが見つかりません"}
      </div>
    )
  }

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold text-gray-900 dark:text-gray-100">
        推しを編集
      </h1>
      <div className="rounded-2xl bg-white dark:bg-gray-800 p-8 shadow-lg border border-gray-200 dark:border-gray-700">
        <OshiForm oshi={oshi} />
      </div>
    </div>
  )
}
