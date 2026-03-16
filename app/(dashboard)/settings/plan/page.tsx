/**
 * プラン管理ページ
 * 現在のプラン表示、アップグレード、キャンセル機能
 */
"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { PlanCard } from "@/components/features/subscription/PlanCard"
import { checkOshiLimitClient } from "@/lib/subscription-client"
import { Button } from "@/components/ui"
import { Loader2, CheckCircle, XCircle } from "lucide-react"
import type { Profile } from "@/types"

export default function PlanPage() {
  const [currentPlan, setCurrentPlan] = useState<"free" | "standard">("free")
  const [oshiLimit, setOshiLimit] = useState<{
    canAdd: boolean
    currentCount: number
    maxCount: number
  } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    fetchPlan()
  }, [])

  // URLパラメータから成功/キャンセルメッセージを表示
  const success = searchParams.get("success")
  const canceled = searchParams.get("canceled")

  const fetchPlan = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/login")
        return
      }

      // プランを取得
      // @ts-ignore - Supabase型定義の問題を回避
      const { data: profile } = await supabase
        .from("profiles")
        .select("plan")
        .eq("id", user.id)
        .single()

      const plan = (profile as any)?.plan || "free"
      setCurrentPlan(plan)

      // 推し登録制限をチェック
      const limit = await checkOshiLimitClient()
      setOshiLimit(limit)
    } catch (error: any) {
      console.error("Error fetching plan:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpgrade = async () => {
    setIsProcessing(true)
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        credentials: "include",
      })

      if (!response.ok) {
        const error = await response.json()
        alert(error.error || "アップグレードに失敗しました")
        return
      }

      const { url } = await response.json()

      if (url) {
        // Stripe Checkoutページにリダイレクト
        window.location.href = url
      }
    } catch (error: any) {
      console.error("Upgrade error:", error)
      alert("アップグレードに失敗しました")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCancel = async () => {
    if (
      !confirm(
        "プランをキャンセルしますか？\n次回の請求日までスタンダードプランの機能をご利用いただけます。"
      )
    ) {
      return
    }

    setIsProcessing(true)
    try {
      // Stripe Customer Portalにリダイレクト
      // 注意: Customer Portalの設定が必要です
      // Stripeダッシュボード > Settings > Billing > Customer portal で有効化
      alert(
        "Stripe Customer Portalへのリダイレクト機能は、Customer Portalの設定が必要です。\n現時点では、Stripeダッシュボードから手動でキャンセルしてください。"
      )
    } catch (error: any) {
      console.error("Cancel error:", error)
      alert("キャンセル処理に失敗しました")
    } finally {
      setIsProcessing(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-pink-500" />
      </div>
    )
  }

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold text-gray-900 dark:text-gray-100">
        プラン管理
      </h1>

      {/* 成功/エラーメッセージ */}
      {success && (
        <div className="mb-6 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4 flex items-center gap-2 text-green-600 dark:text-green-400">
          <CheckCircle className="h-5 w-5" />
          <span>スタンダードプランへのアップグレードが完了しました！</span>
        </div>
      )}

      {canceled && (
        <div className="mb-6 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4 flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
          <XCircle className="h-5 w-5" />
          <span>アップグレードがキャンセルされました</span>
        </div>
      )}

      {/* 現在のプラン情報 */}
      <div className="mb-8 rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-lg border border-gray-200 dark:border-gray-700">
        <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-gray-100">
          現在のプラン
        </h2>
        <div className="flex items-center gap-4">
          <div
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              currentPlan === "standard"
                ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white"
                : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
            }`}
          >
            {currentPlan === "standard" ? "スタンダード" : "無料"}
          </div>
          {oshiLimit && (
            <div className="text-sm text-gray-600 dark:text-gray-400">
              推し登録: {oshiLimit.currentCount} /{" "}
              {oshiLimit.maxCount === -1 ? "無制限" : oshiLimit.maxCount}名
            </div>
          )}
        </div>
      </div>

      {/* プラン一覧 */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <PlanCard
          plan="free"
          name="無料プラン"
          price="¥0"
          features={[
            "推し登録: 1名まで",
            "アーカイブ: 直近3日分",
            "広告表示あり",
          ]}
          isCurrent={currentPlan === "free"}
          onUpgrade={handleUpgrade}
          isLoading={isProcessing}
        />

        <PlanCard
          plan="standard"
          name="スタンダードプラン"
          price="¥650"
          features={[
            "推し登録: 無制限",
            "アーカイブ: 全期間",
            "広告なし",
            "優先サポート",
          ]}
          isCurrent={currentPlan === "standard"}
          onUpgrade={handleUpgrade}
          onCancel={handleCancel}
          isLoading={isProcessing}
        />
      </div>

      {/* 注意事項 */}
      <div className="mt-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4">
        <h3 className="mb-2 font-semibold text-blue-900 dark:text-blue-100">
          ご注意
        </h3>
        <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
          <li>
            • スタンダードプランは月額課金です。毎月自動的に更新されます。
          </li>
          <li>
            • プランのキャンセルは、次回の請求日まで有効です。
          </li>
          <li>
            • プラン変更は即座に反映されます。
          </li>
        </ul>
      </div>
    </div>
  )
}
