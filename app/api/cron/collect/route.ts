/**
 * 情報収集バッチ処理のエントリーポイント
 * Vercel Cron Jobsから毎朝6時に呼び出される
 * 
 * セキュリティ:
 * - Vercel Cronからのリクエストのみを受け付ける
 * - Authorizationヘッダーで認証（CRON_SECRET環境変数）
 * 
 * ローカルテスト方法:
 * 1. 環境変数CRON_SECRETを設定
 * 2. curl -X POST http://localhost:3000/api/cron/collect \
 *        -H "Authorization: Bearer YOUR_CRON_SECRET"
 * 
 * Vercel Cron設定:
 * - vercel.jsonで設定済み（毎朝6時: "0 6 * * *"）
 * - Vercel DashboardのCron Jobsセクションで確認可能
 */
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { CollectorOrchestrator } from '@/lib/collectors'

export const maxDuration = 300 // Vercelの最大実行時間（5分）

export async function GET(request: Request) {
  return handleRequest(request)
}

export async function POST(request: Request) {
  return handleRequest(request)
}

async function handleRequest(request: Request) {
  try {
    // セキュリティチェック: Vercel Cronからのリクエストか確認
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret) {
      // CRON_SECRETが設定されている場合は認証を要求
      if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }
    } else {
      // 本番環境ではCRON_SECRETの設定を推奨
      // 開発環境では警告のみ
      if (process.env.NODE_ENV === 'production') {
        console.warn('WARNING: CRON_SECRET is not set in production')
      }
    }

    // Vercel Cronからのリクエストか確認（X-Vercel-Cronヘッダー）
    const vercelCronHeader = request.headers.get('x-vercel-cron')
    if (!vercelCronHeader && process.env.NODE_ENV === 'production') {
      // 本番環境ではVercel Cronからのリクエストのみ受け付ける
      return NextResponse.json(
        { error: 'Invalid request source' },
        { status: 403 }
      )
    }

    console.log('Starting collection batch process...')
    const startTime = Date.now()

    // Supabaseクライアントを取得
    const supabase = await createClient()

    // コレクターオーケストレーターを初期化
    const orchestrator = new CollectorOrchestrator(supabase)

    // 全推しの情報を収集
    const stats = await orchestrator.collectAll()

    // ログを記録
    await orchestrator.logCollection(stats)

    const duration = Date.now() - startTime

    return NextResponse.json({
      success: true,
      message: 'Collection batch completed',
      stats: {
        ...stats,
        duration_ms: duration,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('Collection batch error:', error)

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}
