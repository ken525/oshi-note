/**
 * トップページのクライアントコンポーネント
 * リンクのクリックを確実に動作させるため
 */
"use client"

import { useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'

export function HomeClient() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const loginButtonRef = useRef<HTMLButtonElement>(null)
  const signupButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    setIsMounted(true)
    console.log('HomeClient mounted, router available:', !!router)
  }, [router])

  // ボタンがマウントされた後にイベントリスナーを追加
  useEffect(() => {
    if (!isMounted) return

    // 少し待ってからボタンを取得（DOMが完全にレンダリングされるまで）
    const timer = setTimeout(() => {
      const loginButton = loginButtonRef.current
      const signupButton = signupButtonRef.current
      
      console.log('Setting up event listeners, loginButton:', !!loginButton, 'signupButton:', !!signupButton)
      
      const handleLogin = (e: Event) => {
        e.preventDefault()
        e.stopPropagation()
        console.log('Login button clicked (via ref), navigating to /login')
        console.log('Current location:', window.location.href)
        console.log('Target location:', window.location.origin + '/login')
        try {
          window.location.replace('/login')
          console.log('window.location.replace called')
        } catch (err) {
          console.error('Navigation error:', err)
          window.location.href = '/login'
        }
      }
      
      const handleSignup = (e: Event) => {
        e.preventDefault()
        e.stopPropagation()
        console.log('Signup button clicked (via ref), navigating to /signup')
        console.log('Current location:', window.location.href)
        console.log('Target location:', window.location.origin + '/signup')
        try {
          window.location.replace('/signup')
          console.log('window.location.replace called')
        } catch (err) {
          console.error('Navigation error:', err)
          window.location.href = '/signup'
        }
      }
      
      if (loginButton) {
        loginButton.addEventListener('click', handleLogin, true) // capture phase
        console.log('Login button event listener added')
      } else {
        console.warn('Login button not found!')
      }
      
      if (signupButton) {
        signupButton.addEventListener('click', handleSignup, true) // capture phase
        console.log('Signup button event listener added')
      } else {
        console.warn('Signup button not found!')
      }
      
      return () => {
        if (loginButton) {
          loginButton.removeEventListener('click', handleLogin, true)
        }
        if (signupButton) {
          signupButton.removeEventListener('click', handleSignup, true)
        }
      }
    }, 100)

    return () => {
      clearTimeout(timer)
    }
  }, [isMounted])

  const handleLoginClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()
    console.log('Login button clicked (via onClick)')
    console.log('Current location:', window.location.href)
    console.log('Target location:', window.location.origin + '/login')
    setError(null)
    
    // window.location.replaceを使用（より確実）
    try {
      console.log('Calling window.location.replace("/login")')
      window.location.replace('/login')
      console.log('window.location.replace called successfully')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      console.error('Login navigation error:', err)
      setError(`ログインエラー: ${errorMessage}`)
      // フォールバック
      window.location.href = '/login'
    }
  }

  const handleSignupClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()
    console.log('Signup button clicked (via onClick)')
    console.log('Current location:', window.location.href)
    console.log('Target location:', window.location.origin + '/signup')
    setError(null)
    
    // window.location.replaceを使用（より確実）
    try {
      console.log('Calling window.location.replace("/signup")')
      window.location.replace('/signup')
      console.log('window.location.replace called successfully')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      console.error('Signup navigation error:', err)
      setError(`新規登録エラー: ${errorMessage}`)
      // フォールバック
      window.location.href = '/signup'
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
          <button
            ref={loginButtonRef}
            type="button"
            onClick={handleLoginClick}
            className="inline-flex items-center justify-center px-6 py-3 text-lg font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white focus:ring-pink-500 cursor-pointer"
          >
            ログイン
          </button>
          <button
            ref={signupButtonRef}
            type="button"
            onClick={handleSignupClick}
            className="inline-flex items-center justify-center px-6 py-3 text-lg font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-500 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800 cursor-pointer"
          >
            新規登録
          </button>
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
