/**
 * 推し登録・編集フォームコンポーネント
 * 画像アップロード機能を含む
 */
"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button, Input } from "@/components/ui"
import { Loader2, X, Upload, Image as ImageIcon } from "lucide-react"
import { UpgradeModal } from "./UpgradeModal"
import type { Oshi, OshiInsert } from "@/types"

const oshiSchema = z.object({
  name: z.string().min(1, "推しの名前を入力してください"),
  group_name: z.string().optional(),
  keywords: z.array(z.string()),
})

type OshiFormData = z.infer<typeof oshiSchema>

interface OshiFormProps {
  oshi?: Oshi
  onSuccess?: () => void
}

export function OshiForm({ oshi, onSuccess }: OshiFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [keywords, setKeywords] = useState<string[]>(oshi?.keywords || [])
  const [keywordInput, setKeywordInput] = useState("")
  const [iconFile, setIconFile] = useState<File | null>(null)
  const [iconPreview, setIconPreview] = useState<string | null>(oshi?.icon_url || null)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<OshiFormData>({
    resolver: zodResolver(oshiSchema),
    defaultValues: {
      name: oshi?.name || "",
      group_name: oshi?.group_name || "",
      keywords: oshi?.keywords || [],
    },
  })

  useEffect(() => {
    setValue("keywords", keywords)
  }, [keywords, setValue])

  const handleAddKeyword = () => {
    if (keywordInput.trim() && !keywords.includes(keywordInput.trim())) {
      setKeywords([...keywords, keywordInput.trim()])
      setKeywordInput("")
    }
  }

  const handleRemoveKeyword = (keyword: string) => {
    setKeywords(keywords.filter((k) => k !== keyword))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("画像サイズは5MB以下にしてください")
        return
      }
      setIconFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setIconPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const uploadIcon = async (userId: string, oshiId: string): Promise<string | null> => {
    if (!iconFile) return null

    try {
      const fileExt = iconFile.name.split(".").pop()
      const fileName = `${oshiId}.${fileExt}`
      const filePath = `${userId}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from("oshi-icons")
        .upload(filePath, iconFile, {
          cacheControl: "3600",
          upsert: true,
        })

      if (uploadError) {
        throw uploadError
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("oshi-icons").getPublicUrl(filePath)

      return publicUrl
    } catch (error) {
      console.error("画像アップロードエラー:", error)
      return null
    }
  }

  const onSubmit = async (data: OshiFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setError("ログインが必要です")
        return
      }

      // プラン制限チェック（新規登録時のみ）
      if (!oshi) {
        // @ts-ignore - Supabase型定義の問題を回避
        const { data: profile } = await supabase
          .from("profiles")
          .select("plan")
          .eq("id", user.id)
          .single()

        if (profile && (profile as any).plan === "free") {
          // @ts-ignore - Supabase型定義の問題を回避
          const { count } = await supabase
            .from("oshi")
            .select("*", { count: "exact", head: true })
            .eq("user_id", user.id)

          if (count && count >= 1) {
            setShowUpgradeModal(true)
            setIsLoading(false)
            return
          }
        }
      }

      if (oshi) {
        // 更新
        let iconUrl = oshi.icon_url || null
        if (iconFile) {
          const uploadedUrl = await uploadIcon(user.id, oshi.id)
          if (uploadedUrl) iconUrl = uploadedUrl
        }
        const oshiData = {
          name: data.name,
          group_name: data.group_name || null,
          keywords: keywords,
          icon_url: iconUrl,
          user_id: user.id,
        }
        // @ts-ignore - Supabase型定義の問題を回避
        const { error: updateError } = await (supabase
          .from("oshi")
          .update(oshiData as any)
          .eq("id", oshi.id)
          .eq("user_id", user.id) as any)

        if (updateError) throw updateError
        if (onSuccess) {
          onSuccess()
        } else {
          router.push("/oshi")
          router.refresh()
        }
        return
      }

      // 新規作成: API経由で登録（バックグラウンドで記事生成がキックされる）
      const res = await fetch("/api/oshi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: data.name,
          group_name: data.group_name || null,
          keywords: keywords,
          icon_url: null,
        }),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        if (res.status === 403) {
          setShowUpgradeModal(true)
          return
        }
        throw new Error((errData as any).error || "登録に失敗しました")
      }

      const { data: newOshi } = await res.json()
      const newId = (newOshi as any)?.id
      if (!newId) throw new Error("登録後のデータを取得できませんでした")

      if (iconFile) {
        const uploadedUrl = await uploadIcon(user.id, newId)
        if (uploadedUrl) {
          await supabase
            .from("oshi")
            .update({ icon_url: uploadedUrl })
            .eq("id", newId)
            .eq("user_id", user.id)
        }
      }

      setToastMessage("🎀 推しノートを準備中...")
      setTimeout(() => {
        router.push(`/oshi/${newId}/articles`)
        router.refresh()
      }, 1500)
    } catch (err: any) {
      setError(err.message || "エラーが発生しました")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {toastMessage && (
        <div
          className="fixed left-1/2 top-6 z-50 -translate-x-1/2 rounded-lg border border-pink-200 dark:border-pink-800 bg-pink-50 dark:bg-pink-900/30 px-6 py-3 text-center text-pink-800 dark:text-pink-200 shadow-lg"
          role="status"
          aria-live="polite"
        >
          {toastMessage}
        </div>
      )}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* アイコン画像アップロード */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          アイコン画像
        </label>
        <div className="flex items-center gap-4">
          <div className="relative w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-pink-200 to-purple-200 dark:from-pink-900 dark:to-purple-900 flex items-center justify-center">
            {iconPreview ? (
              <img
                src={iconPreview}
                alt="アイコン"
                className="w-full h-full object-cover"
              />
            ) : (
              <ImageIcon className="w-8 h-8 text-gray-400" />
            )}
          </div>
          <div>
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                disabled={isLoading}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                画像を選択
              </Button>
            </label>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              JPEG, PNG, WebP, GIF (最大5MB)
            </p>
          </div>
        </div>
      </div>

      <Input
        label="推しの名前 *"
        placeholder="例: 山田花子"
        {...register("name")}
        error={errors.name?.message}
        disabled={isLoading}
      />

      <Input
        label="グループ名"
        placeholder="例: アイドルグループA"
        {...register("group_name")}
        error={errors.group_name?.message}
        disabled={isLoading}
      />

      {/* キーワード入力 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          検索キーワード
        </label>
        <div className="flex gap-2 mb-2">
          <Input
            placeholder="キーワードを入力"
            value={keywordInput}
            onChange={(e) => setKeywordInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                handleAddKeyword()
              }
            }}
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            onClick={handleAddKeyword}
            disabled={isLoading || !keywordInput.trim()}
          >
            追加
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {keywords.map((keyword) => (
            <span
              key={keyword}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 text-sm"
            >
              {keyword}
              <button
                type="button"
                onClick={() => handleRemoveKeyword(keyword)}
                disabled={isLoading}
                className="hover:text-pink-900 dark:hover:text-pink-100"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      </div>

      <div className="flex gap-4">
        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {oshi ? "更新中..." : "登録中..."}
            </>
          ) : (
            oshi ? "更新" : "登録"
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={() => router.back()}
          disabled={isLoading}
        >
          キャンセル
        </Button>
      </div>

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
      />
    </form>
    </>
  )
}
