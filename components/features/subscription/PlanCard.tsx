/**
 * プランカードコンポーネント
 */
"use client"

import { Check, X } from "lucide-react"
import { Button } from "@/components/ui"
import type { Plan } from "@/lib/subscription"

interface PlanCardProps {
  plan: Plan
  name: string
  price: string
  features: string[]
  isCurrent?: boolean
  onUpgrade?: () => void
  onCancel?: () => void
  isLoading?: boolean
}

export function PlanCard({
  plan,
  name,
  price,
  features,
  isCurrent = false,
  onUpgrade,
  onCancel,
  isLoading = false,
}: PlanCardProps) {
  return (
    <div
      className={`relative rounded-2xl border-2 p-8 transition-all ${
        isCurrent
          ? "border-pink-500 bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 shadow-lg"
          : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
      }`}
    >
      {isCurrent && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 px-4 py-1 text-xs font-semibold text-white">
          現在のプラン
        </div>
      )}

      <div className="mb-4">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {name}
        </h3>
        <div className="mt-2">
          <span className="text-4xl font-bold text-gray-900 dark:text-gray-100">
            {price}
          </span>
          {plan === "standard" && (
            <span className="text-gray-600 dark:text-gray-400">/月</span>
          )}
        </div>
      </div>

      <ul className="mb-6 space-y-3">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start gap-2">
            <Check className="h-5 w-5 shrink-0 text-pink-500 dark:text-pink-400" />
            <span className="text-gray-700 dark:text-gray-300">{feature}</span>
          </li>
        ))}
      </ul>

      {isCurrent ? (
        plan === "standard" ? (
          <Button
            variant="outline"
            className="w-full"
            onClick={onCancel}
            disabled={isLoading}
          >
            {isLoading ? "処理中..." : "プランをキャンセル"}
          </Button>
        ) : (
          <div className="text-center text-sm text-gray-600 dark:text-gray-400">
            現在のプラン
          </div>
        )
      ) : (
        <Button
          variant="primary"
          className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white"
          onClick={onUpgrade}
          disabled={isLoading}
        >
          {isLoading ? "処理中..." : "このプランに変更"}
        </Button>
      )}
    </div>
  )
}
