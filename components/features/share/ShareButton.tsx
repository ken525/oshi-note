/**
 * 共有ボタンコンポーネント
 * X（Twitter）共有機能
 * シェアテキストのカスタマイズモーダル付き
 */
"use client"

import { useState } from "react"
import { Twitter, X } from "lucide-react"
import { Button, Input } from "@/components/ui"

interface ShareButtonProps {
  title: string
  url: string
  oshiName?: string
}

export function ShareButton({ title, url, oshiName }: ShareButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [customText, setCustomText] = useState("")

  // デフォルトシェアテキストを生成
  const defaultText = `【推しノート📒】${title} #推しノート${oshiName ? ` #${oshiName.replace(/\s+/g, '')}` : ''}`

  const handleShare = (shareText?: string) => {
    const text = encodeURIComponent(shareText || customText || defaultText)
    const shareUrl = encodeURIComponent(url)
    const twitterUrl = `https://twitter.com/intent/tweet?text=${text}&url=${shareUrl}`
    window.open(twitterUrl, "_blank", "width=550,height=420")
    setIsModalOpen(false)
  }

  const handleQuickShare = () => {
    handleShare(defaultText)
  }

  return (
    <>
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={handleQuickShare}
          className="flex items-center gap-2"
          aria-label="Xでシェア"
        >
          <Twitter className="h-4 w-4" />
          Xで共有
        </Button>
        <Button
          variant="outline"
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2"
          aria-label="シェアテキストをカスタマイズ"
        >
          カスタマイズ
        </Button>
      </div>

      {/* カスタマイズモーダル */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* オーバーレイ */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          />

          {/* モーダル */}
          <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-xl border border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 rounded-full p-1 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </button>

            <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-gray-100">
              Xでシェア
            </h2>

            <div className="mb-4 space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                シェアテキスト
              </label>
              <textarea
                value={customText || defaultText}
                onChange={(e) => setCustomText(e.target.value)}
                placeholder={defaultText}
                className="w-full min-h-[120px] rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500 dark:focus:ring-pink-400"
                maxLength={280}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {(customText || defaultText).length} / 280文字
              </p>
            </div>

            <div className="mb-4 rounded-lg bg-gray-50 dark:bg-gray-900 p-3">
              <p className="text-xs text-gray-600 dark:text-gray-400">
                プレビュー:
              </p>
              <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                {customText || defaultText}
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setIsModalOpen(false)}
              >
                キャンセル
              </Button>
              <Button
                variant="primary"
                className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white"
                onClick={() => handleShare()}
              >
                <Twitter className="mr-2 h-4 w-4" />
                シェア
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
