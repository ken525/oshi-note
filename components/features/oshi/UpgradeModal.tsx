/**
 * アップグレード促進モーダル
 * 無料プランで上限に達した場合に表示
 */
"use client"

import { X } from "lucide-react"
import { Button } from "@/components/ui"
import Link from "next/link"

interface UpgradeModalProps {
  isOpen: boolean
  onClose: () => void
}

export function UpgradeModal({ isOpen, onClose }: UpgradeModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* オーバーレイ */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* モーダル */}
      <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-xl border border-gray-200 dark:border-gray-700">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
        </button>

        <div className="mb-4 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-purple-500">
            <span className="text-2xl">✨</span>
          </div>
          <h2 className="mb-2 text-2xl font-bold text-gray-900 dark:text-gray-100">
            プランをアップグレード
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            無料プランでは1名まで登録できます
          </p>
        </div>

        <div className="mb-6 rounded-lg bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 p-4 border border-pink-200 dark:border-pink-800">
          <h3 className="mb-2 font-semibold text-gray-900 dark:text-gray-100">
            スタンダードプランの特典
          </h3>
          <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
            <li>✓ 推しの登録数無制限</li>
            <li>✓ 記事生成機能</li>
            <li>✓ 優先サポート</li>
          </ul>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onClose}
          >
            後で
          </Button>
          <Link href="/settings/plan" className="flex-1">
            <Button
              variant="primary"
              className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white"
            >
              アップグレード
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
