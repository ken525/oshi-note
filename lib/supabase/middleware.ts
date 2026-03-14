/**
 * Supabaseクライアント（ミドルウェア用）
 * Next.jsミドルウェアでSupabaseにアクセスする際に使用
 * 認証ガード機能も実装
 */
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/types/database'

export async function updateSession(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // 環境変数が設定されていない場合は、認証チェックをスキップして続行
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase環境変数が設定されていません。認証チェックをスキップします。')
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({
          request,
        })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        )
      },
    },
  })

  // セッションを更新してユーザー情報を取得
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  const url = request.nextUrl.clone()
  const pathname = url.pathname

  // デバッグログ（本番環境でも確認できるように）
  console.log('[Middleware] Path:', pathname, 'User:', !!user, 'Error:', userError?.message)

  // 認証が必要なルート（ダッシュボード配下、推し、記事、アーカイブ、設定など）
  const protectedRoutes = ['/oshi', '/articles', '/archive', '/settings']
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  )

  // 認証不要なルート（ログイン、サインアップ、コールバック、トップページ）
  const authRoutes = ['/login', '/signup']
  const isAuthRoute = authRoutes.includes(pathname)
  const isPublicRoute = pathname.startsWith('/auth/callback') || pathname === '/'

  // 未認証ユーザーが保護されたルートにアクセスした場合
  if (isProtectedRoute && !user) {
    console.log('[Middleware] Redirecting to /login (protected route, no user)')
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // 認証済みユーザーがログイン/サインアップページにアクセスした場合
  if (isAuthRoute && user) {
    console.log('[Middleware] Redirecting to / (auth route, user exists)')
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  // ログイン/サインアップページへのアクセスを許可（未認証ユーザー）
  if (isAuthRoute && !user) {
    console.log('[Middleware] Allowing access to', pathname, '(no user)')
    return NextResponse.next({ request })
  }

  // パブリックルートへのアクセスを許可
  if (isPublicRoute) {
    console.log('[Middleware] Allowing access to', pathname, '(public route)')
    return supabaseResponse
  }

  console.log('[Middleware] Allowing access to', pathname)
  return supabaseResponse
}
