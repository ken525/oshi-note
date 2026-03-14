/**
 * ログインフォームコンポーネント
 * メールアドレス＋パスワード認証とGoogle OAuthログインを提供
 */
"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button, Input } from "@/components/ui"
import { Loader2 } from "lucide-react"

const loginSchema = z.object({
  email: z.string().email("有効なメールアドレスを入力してください"),
  password: z.string().min(6, "パスワードは6文字以上で入力してください"),
})

type LoginFormData = z.infer<typeof loginSchema>

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      // Supabaseクライアントの初期化（環境変数チェックは内部で行われる）
      const supabase = createClient()

      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (signInError) {
        console.error("Login error:", signInError)
        setError(signInError.message || "ログインに失敗しました。メールアドレスとパスワードを確認してください。")
        setIsLoading(false)
        return
      }

      if (!signInData?.user) {
        setError("ログインに失敗しました。ユーザー情報を取得できませんでした。")
        setIsLoading(false)
        return
      }

      // ログイン成功後、少し待ってからリダイレクト
      await new Promise(resolve => setTimeout(resolve, 100))
      router.push("/")
      router.refresh()
    } catch (err) {
      console.error("Unexpected login error:", err)
      const errorMessage = err instanceof Error ? err.message : "ログインに失敗しました。もう一度お試しください。"
      setError(errorMessage)
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Supabaseクライアントの初期化（環境変数チェックは内部で行われる）
      const supabase = createClient()

      const { data: oauthData, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/`,
        },
      })

      if (oauthError) {
        console.error("OAuth error:", oauthError)
        setError(oauthError.message || "Googleログインに失敗しました。")
        setIsLoading(false)
        return
      }

      // OAuthの場合はリダイレクトが自動的に行われるため、ここでは何もしない
      // エラーがない場合は、OAuthプロバイダーにリダイレクトされる
    } catch (err) {
      console.error("Unexpected OAuth error:", err)
      const errorMessage = err instanceof Error ? err.message : "Googleログインに失敗しました。もう一度お試しください。"
      setError(errorMessage)
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      <Input
        label="メールアドレス"
        type="email"
        placeholder="example@email.com"
        {...register("email")}
        error={errors.email?.message}
        disabled={isLoading}
      />

      <Input
        label="パスワード"
        type="password"
        placeholder="••••••••"
        {...register("password")}
        error={errors.password?.message}
        disabled={isLoading}
      />

      <Button
        type="submit"
        variant="primary"
        size="lg"
        className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-medium"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ログイン中...
          </>
        ) : (
          "ログイン"
        )}
      </Button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-gray-300 dark:border-gray-700" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white dark:bg-gray-900 px-2 text-gray-500 dark:text-gray-400">
            または
          </span>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        size="lg"
        className="w-full"
        onClick={handleGoogleLogin}
        disabled={isLoading}
      >
        <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="currentColor"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="currentColor"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="currentColor"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        Googleでログイン
      </Button>
    </form>
  )
}
