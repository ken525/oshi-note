/**
 * 推しカードコンポーネント
 * アイドルのライブ写真風のビジュアルデザイン
 */
"use client"

import Link from "next/link"
import Image from "next/image"
import { Edit2, Trash2, MoreVertical } from "lucide-react"
import { useState } from "react"
import type { Oshi } from "@/types"

interface OshiCardProps {
  oshi: Oshi
  onDelete?: (id: string) => void
}

export function OshiCard({ oshi, onDelete }: OshiCardProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!onDelete || !confirm("この推しを削除しますか？")) return

    setIsDeleting(true)
    try {
      await onDelete(oshi.id)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-pink-500 via-purple-500 to-pink-600 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
      {/* 背景グラデーションオーバーレイ */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
      
      {/* アイコン画像 */}
      <div className="relative h-48 w-full overflow-hidden">
        {oshi.icon_url ? (
          <Image
            src={oshi.icon_url}
            alt={oshi.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-pink-300 to-purple-300">
            <span className="text-4xl font-bold text-white">
              {oshi.name.charAt(0)}
            </span>
          </div>
        )}
        {/* グラデーションオーバーレイ */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
      </div>

      {/* コンテンツ */}
      <div className="relative p-6 text-white">
        <div className="mb-2 flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-2xl font-bold mb-1">{oshi.name}</h3>
            {oshi.group_name && (
              <p className="text-sm text-white/80">{oshi.group_name}</p>
            )}
          </div>
          
          {/* メニューボタン */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="rounded-full p-2 hover:bg-white/20 transition-colors"
            >
              <MoreVertical className="h-5 w-5" />
            </button>
            
            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 top-10 z-20 w-40 rounded-lg bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <Link
                    href={`/oshi/${oshi.id}/edit`}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    onClick={() => setShowMenu(false)}
                  >
                    <Edit2 className="h-4 w-4" />
                    編集
                  </Link>
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    {isDeleting ? "削除中..." : "削除"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* キーワードタグ */}
        {oshi.keywords && oshi.keywords.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {oshi.keywords.slice(0, 3).map((keyword) => (
              <span
                key={keyword}
                className="rounded-full bg-white/20 backdrop-blur-sm px-3 py-1 text-xs font-medium text-white border border-white/30"
              >
                {keyword}
              </span>
            ))}
            {oshi.keywords.length > 3 && (
              <span className="rounded-full bg-white/20 backdrop-blur-sm px-3 py-1 text-xs font-medium text-white border border-white/30">
                +{oshi.keywords.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* ホバー時のエフェクト */}
      <div className="absolute inset-0 bg-gradient-to-r from-pink-400/0 via-purple-400/0 to-pink-400/0 group-hover:from-pink-400/10 group-hover:via-purple-400/10 group-hover:to-pink-400/10 transition-all duration-300 pointer-events-none" />
    </div>
  )
}
