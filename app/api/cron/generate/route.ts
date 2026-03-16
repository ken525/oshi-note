/**
 * 記事生成バッチ処理のエントリーポイント
 * Vercel Cron Jobsから毎朝7時に呼び出される（情報収集の後）
 * 
 * 処理フロー:
 * 1. raw_postsから当日収集した推しの投稿を取得
 * 2. 推しごとにグループ化
 * 3. Claude APIで記事を生成
 * 4. 生成結果をarticlesテーブルに保存
 * 
 * セキュリティ:
 * - Vercel Cronからのリクエストのみを受け付ける
 * - Authorizationヘッダーで認証（CRON_SECRET環境変数）
 * 
 * ローカルテスト方法:
 * curl -X POST http://localhost:3000/api/cron/generate \
 *      -H "Authorization: Bearer YOUR_CRON_SECRET"
 */
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ArticleGenerator } from '@/lib/ai/articleGenerator'
import type { Oshi, RawPost } from '@/types'

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
      if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }
    } else {
      if (process.env.NODE_ENV === 'production') {
        console.warn('WARNING: CRON_SECRET is not set in production')
      }
    }

    // Vercel Cronからのリクエストか確認
    const vercelCronHeader = request.headers.get('x-vercel-cron')
    if (!vercelCronHeader && process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Invalid request source' },
        { status: 403 }
      )
    }

    console.log('Starting article generation batch process...')
    const startTime = Date.now()

    const supabase = await createClient()

    // 直近7日以内にログインしたアクティブユーザーのみ対象
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const { data: activeProfiles } = await supabase
      .from('profiles')
      .select('id')
      .gte('last_active_at', sevenDaysAgo.toISOString())

    const activeUserIds = new Set((activeProfiles || []).map((p: any) => p.id))
    console.log('[Cron] Active users (last 7 days):', activeUserIds.size)

    // 当日収集したraw_postsを取得
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // @ts-ignore - Supabase型定義の問題を回避
    const { data: rawPosts, error: rawPostsError } = await supabase
      .from('raw_posts')
      .select('*')
      .gte('collected_at', today.toISOString())
      .lt('collected_at', tomorrow.toISOString())

    if (rawPostsError) {
      throw new Error(`Failed to fetch raw_posts: ${rawPostsError.message}`)
    }

    if (!rawPosts || rawPosts.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No raw posts found for today',
        stats: {
          total_oshi: 0,
          total_generated: 0,
          duration_ms: Date.now() - startTime,
        },
        timestamp: new Date().toISOString(),
      })
    }

    // 推しごとにグループ化
    const postsByOshi: Record<string, RawPost[]> = {}
    for (const post of rawPosts) {
      const oshiId = (post as any).oshi_id
      if (!postsByOshi[oshiId]) {
        postsByOshi[oshiId] = []
      }
      postsByOshi[oshiId].push(post as RawPost)
    }

    // 各推しの記事を生成
    const generator = new ArticleGenerator()
    const results: Array<{
      oshi_id: string
      success: boolean
      article_id?: string
      error?: string
    }> = []

    for (const [oshiId, posts] of Object.entries(postsByOshi)) {
      try {
        // 推し情報を取得
        // @ts-ignore - Supabase型定義の問題を回避
        const { data: oshi, error: oshiError } = await supabase
          .from('oshi')
          .select('*')
          .eq('id', oshiId)
          .single()

        if (oshiError || !oshi) {
          console.error(`Failed to fetch oshi ${oshiId}:`, oshiError)
          results.push({
            oshi_id: oshiId,
            success: false,
            error: 'Failed to fetch oshi',
          })
          continue
        }

        const oshiUserId = (oshi as any).user_id
        if (!activeUserIds.has(oshiUserId)) {
          console.log(`[Cron] Skipping oshi ${oshiId} (user ${oshiUserId} not active in last 7 days)`)
          results.push({
            oshi_id: oshiId,
            success: false,
            error: 'User not active (skipped)',
          })
          continue
        }

        // 記事を生成
        const generationResult = await generator.generate(oshi as Oshi, posts)

        if (!generationResult.success || !generationResult.article) {
          results.push({
            oshi_id: oshiId,
            success: false,
            error: generationResult.error || 'Generation failed',
          })
          continue
        }

        const article = generationResult.article

        // 既存の記事をチェック（同じ推しで当日の記事が既にある場合）
        // @ts-ignore - Supabase型定義の問題を回避
        const { data: existingArticle } = await supabase
          .from('articles')
          .select('id')
          .eq('oshi_id', oshiId)
          .eq('user_id', (oshi as any).user_id)
          .gte('created_at', today.toISOString())
          .lt('created_at', tomorrow.toISOString())
          .single()

        if (existingArticle) {
          // 既存の記事を更新
          // @ts-ignore - Supabase型定義の問題を回避
          const updateData = {
            title: article.title,
            content: article.content,
            highlights: article.highlights,
            source_links: article.source_links,
            published_date: new Date().toISOString().split('T')[0],
          }
          // @ts-ignore - Supabase型定義の問題を回避
          const { data: updatedArticle, error: updateError } = await (supabase
            .from('articles')
            // @ts-ignore
            .update(updateData)
            .eq('id', (existingArticle as any).id)
            .select()
            .single() as any)

          if (updateError) {
            throw updateError
          }

          results.push({
            oshi_id: oshiId,
            success: true,
            article_id: (updatedArticle as any)?.id,
          })
        } else {
          // 新規記事を作成
          // @ts-ignore - Supabase型定義の問題を回避
          const insertData = {
            user_id: (oshi as any).user_id,
            oshi_id: oshiId,
            title: article.title,
            content: article.content,
            highlights: article.highlights,
            source_links: article.source_links,
            published_date: new Date().toISOString().split('T')[0],
          }
          // @ts-ignore - Supabase型定義の問題を回避
          const { data: newArticle, error: insertError } = await (supabase
            .from('articles')
            .insert(insertData as any)
            .select()
            .single() as any)

          if (insertError) {
            throw insertError
          }

          results.push({
            oshi_id: oshiId,
            success: true,
            article_id: (newArticle as any)?.id,
          })
        }
      } catch (error: any) {
        console.error(`Error generating article for oshi ${oshiId}:`, error)
        results.push({
          oshi_id: oshiId,
          success: false,
          error: error.message || 'Unknown error',
        })
      }
    }

    const duration = Date.now() - startTime
    const successCount = results.filter((r) => r.success).length

    return NextResponse.json({
      success: true,
      message: 'Article generation batch completed',
      stats: {
        total_oshi: Object.keys(postsByOshi).length,
        total_generated: successCount,
        results,
        duration_ms: duration,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('Article generation batch error:', error)

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
