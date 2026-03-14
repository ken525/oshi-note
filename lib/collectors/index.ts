/**
 * コレクターオーケストレーター
 * 全コレクターをまとめて実行し、結果をraw_postsテーブルに保存
 * 
 * 機能:
 * - 各コレクターを並列実行（エラーが発生しても他のコレクターに影響しない）
 * - 重複チェック（URLベース）
 * - 収集結果のログ記録
 */
import { createClient } from '@/lib/supabase/server'
import { TwitterCollector } from './twitter'
import { YouTubeCollector } from './youtube'
import { WebsiteCollector } from './website'
import type { Oshi } from '@/types'

interface CollectionResult {
  oshi_id: string
  source: 'twitter' | 'youtube' | 'website'
  success: boolean
  count: number
  error?: string
}

interface CollectionStats {
  total_oshi: number
  total_collected: number
  results: CollectionResult[]
  errors: string[]
}

export class CollectorOrchestrator {
  private supabase: Awaited<ReturnType<typeof createClient>>

  constructor(supabase: Awaited<ReturnType<typeof createClient>>) {
    this.supabase = supabase
  }

  /**
   * 全推しの情報を収集
   */
  async collectAll(): Promise<CollectionStats> {
    const stats: CollectionStats = {
      total_oshi: 0,
      total_collected: 0,
      results: [],
      errors: [],
    }

    try {
      // 全推しを取得
      // @ts-ignore - Supabase型定義の問題を回避
      const { data: oshiList, error: oshiError } = await this.supabase
        .from('oshi')
        .select('*')

      if (oshiError) {
        throw new Error(`Failed to fetch oshi list: ${oshiError.message}`)
      }

      if (!oshiList || oshiList.length === 0) {
        console.log('No oshi found to collect')
        return stats
      }

      stats.total_oshi = oshiList.length

      // 各推しの情報を収集
      for (const oshi of oshiList) {
        try {
          const result = await this.collectForOshi(oshi as Oshi)
          stats.results.push(...result)
          stats.total_collected += result.reduce((sum, r) => sum + (r.success ? r.count : 0), 0)
        } catch (error: any) {
          const errorMsg = `Error collecting for oshi ${(oshi as any).id}: ${error.message}`
          console.error(errorMsg)
          stats.errors.push(errorMsg)
        }
      }
    } catch (error: any) {
      const errorMsg = `Orchestrator error: ${error.message}`
      console.error(errorMsg)
      stats.errors.push(errorMsg)
    }

    return stats
  }

  /**
   * 特定の推しの情報を収集
   */
  async collectForOshi(oshi: Oshi): Promise<CollectionResult[]> {
    const results: CollectionResult[] = []

    // 各コレクターを並列実行（エラーが発生しても他のコレクターに影響しない）
    const collectors = [
      { name: 'twitter' as const, collector: new TwitterCollector() },
      { name: 'youtube' as const, collector: new YouTubeCollector() },
      { name: 'website' as const, collector: new WebsiteCollector() },
    ]

    const promises = collectors.map(async ({ name, collector }) => {
      try {
        const collectedData = await collector.collect(oshi)
        const savedCount = await this.saveToDatabase(oshi.id, name, collectedData)
        
        return {
          oshi_id: oshi.id,
          source: name,
          success: true,
          count: savedCount,
        } as CollectionResult
      } catch (error: any) {
        console.error(`${name} collector error for oshi ${oshi.id}:`, error.message)
        return {
          oshi_id: oshi.id,
          source: name,
          success: false,
          count: 0,
          error: error.message,
        } as CollectionResult
      }
    })

    const collectorResults = await Promise.allSettled(promises)
    
    for (const result of collectorResults) {
      if (result.status === 'fulfilled') {
        results.push(result.value)
      } else {
        results.push({
          oshi_id: oshi.id,
          source: 'twitter', // デフォルト値（実際はエラー発生元を記録）
          success: false,
          count: 0,
          error: result.reason?.message || 'Unknown error',
        })
      }
    }

    return results
  }

  /**
   * 収集したデータをデータベースに保存（重複チェック付き）
   */
  private async saveToDatabase(
    oshiId: string,
    source: 'twitter' | 'youtube' | 'website',
    data: any[]
  ): Promise<number> {
    if (data.length === 0) {
      return 0
    }

    let savedCount = 0

    for (const item of data) {
      try {
        // 重複チェック（URLベース）
        const { data: existing } = await this.supabase
          .from('raw_posts')
          .select('id')
          .eq('oshi_id', oshiId)
          .eq('original_url', item.original_url)
          .single()

        if (existing) {
          // 既に存在する場合はスキップ
          continue
        }

        // 新規レコードを挿入
        // @ts-ignore - Supabase型定義の問題を回避
        const { error: insertError } = await (this.supabase
          .from('raw_posts')
          .insert({
            oshi_id: oshiId,
            source: source,
            original_url: item.original_url,
            content: item.content,
            posted_at: item.posted_at,
            collected_at: item.collected_at,
          }) as any)

        if (insertError) {
          console.error(`Failed to save raw_post: ${insertError.message}`)
          continue
        }

        savedCount++
      } catch (error: any) {
        console.error(`Error saving raw_post: ${error.message}`)
        continue
      }
    }

    return savedCount
  }

  /**
   * 収集ログを記録（将来的な拡張）
   */
  async logCollection(stats: CollectionStats): Promise<void> {
    const logMessage = `
=== Collection Log ===
Date: ${new Date().toISOString()}
Total Oshi: ${stats.total_oshi}
Total Collected: ${stats.total_collected}
Results: ${JSON.stringify(stats.results, null, 2)}
Errors: ${stats.errors.length > 0 ? stats.errors.join('\n') : 'None'}
===================
    `.trim()

    console.log(logMessage)

    // 将来的にはログをデータベースや外部サービスに保存することも可能
    // 例: Supabaseのlogsテーブル、CloudWatch、Datadogなど
  }
}
