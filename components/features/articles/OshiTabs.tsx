/**
 * 推し切り替えタブコンポーネント
 */
"use client"

import { useState } from "react"
import { Sparkles } from "lucide-react"
import type { Oshi } from "@/types"

interface OshiTabsProps {
  oshiList: Oshi[]
  selectedOshiId: string | null
  onSelect: (oshiId: string | null) => void
}

export function OshiTabs({ oshiList, selectedOshiId, onSelect }: OshiTabsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      <button
        onClick={() => onSelect(null)}
        className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${
          selectedOshiId === null
            ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg"
            : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
        }`}
      >
        <Sparkles className="h-4 w-4" />
        すべて
      </button>
      {oshiList.map((oshi) => (
        <button
          key={oshi.id}
          onClick={() => onSelect(oshi.id)}
          className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${
            selectedOshiId === oshi.id
              ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg"
              : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          }`}
        >
          {oshi.icon_url ? (
            <img
              src={oshi.icon_url}
              alt={oshi.name}
              className="h-5 w-5 rounded-full object-cover"
            />
          ) : (
            <div className="h-5 w-5 rounded-full bg-gradient-to-br from-pink-300 to-purple-300" />
          )}
          {oshi.name}
        </button>
      ))}
    </div>
  )
}
