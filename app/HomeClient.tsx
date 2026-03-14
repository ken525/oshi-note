/**
 * トップページのクライアントコンポーネント
 * リンクのクリックを確実に動作させるため
 */
"use client"

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

export function HomeClient() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    console.log('HomeClient mounted, router available:', !!router)
  }, [router])

  const handleLoginClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    try {
      e.preventDefault()
      console.log('Login button clicked')
      setError(null)
      
      if (!router) {
        throw new Error('Router is not available')
      }

      // 複数の方法を試す
      try {
        router.push('/login')
        console.log('Router.push called for /login')
      } catch (routerError) {
        console.error('Router.push error:', routerError)
        // フォールバック: window.locationを使用
        window.location.href = '/login'
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      console.error('Login click error:', err)
      setError(`ログインエラー: ${errorMessage}`)
      
      // フォールバック: 直接ナビゲーション
      setTimeout(() => {
        window.location.href = '/login'
      }, 100)
    }
  }

  const handleSignupClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    try {
      e.preventDefault()
      console.log('Signup button clicked')
      setError(null)
      
      if (!router) {
        throw new Error('Router is not available')
      }

      // 複数の方法を試す
      try {
        router.push('/signup')
        console.log('Router.push called for /signup')
      } catch (routerError) {
        console.error('Router.push error:', routerError)
        // フォールバック: window.locationを使用
        window.location.href = '/signup'
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      console.error('Signup click error:', err)
      setError(`新規登録エラー: ${errorMessage}`)
      
      // フォールバック: 直接ナビゲーション
      setTimeout(() => {
        window.location.href = '/signup'
      }, 100)
    }
  }

  if (!isMounted) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-pink-50 via-purple-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <main className="mx-auto max-w-4xl px-4 py-16 text-center">
          <p className="text-gray-600 dark:text-gray-400">読み込み中...</p>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-pink-50 via-purple-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <main className="mx-auto max-w-4xl px-4 py-16 text-center">
        <h1 className="mb-4 bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-5xl font-bold text-transparent">
          私だけの推しノート
        </h1>
        <p className="mb-8 text-xl text-gray-600 dark:text-gray-400">
          あなただけの推しノートを作成・管理するアプリケーション
        </p>
        
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        <div className="flex justify-center gap-4">
          <a
            href="/login"
            onClick={handleLoginClick}
            className="inline-flex items-center justify-center px-6 py-3 text-lg font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white focus:ring-pink-500 cursor-pointer"
          >
            ログイン
          </a>
          <a
            href="/signup"
            onClick={handleSignupClick}
            className="inline-flex items-center justify-center px-6 py-3 text-lg font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-500 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800 cursor-pointer"
          >
            新規登録
          </a>
        </div>

        {/* デバッグ情報（開発環境のみ） */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 text-xs text-gray-500 dark:text-gray-400">
            <p>Router available: {router ? 'Yes' : 'No'}</p>
            <p>Mounted: {isMounted ? 'Yes' : 'No'}</p>
          </div>
        )}
      </main>
    </div>
  )
}
