/**
 * YouTubeコレクター
 * YouTube Data API v3を使用して動画情報を収集
 * 
 * レートリミット:
 * - 10,000 units/day (デフォルト)
 * - Search: 100 units/request
 * - Videos: 1 unit/request
 */
import { google } from 'googleapis'
import type { Oshi } from '@/types'

interface YouTubeCollectorResult {
  source: 'youtube'
  original_url: string
  content: string
  posted_at: Date | null
  collected_at: Date
  metadata?: {
    video_id?: string
    channel_id?: string
    channel_title?: string
    thumbnail_url?: string
    view_count?: number
  }
}

export class YouTubeCollector {
  private youtube: any
  private rateLimitDelay: number = 2000 // 2秒間隔でリクエスト

  constructor() {
    const apiKey = process.env.YOUTUBE_API_KEY
    if (!apiKey) {
      throw new Error('YOUTUBE_API_KEY is not set')
    }
    this.youtube = google.youtube({
      version: 'v3',
      auth: apiKey,
    })
  }

  /**
   * 推しのキーワードでYouTube動画を検索
   */
  async collect(oshi: Oshi): Promise<YouTubeCollectorResult[]> {
    if (!oshi.keywords || oshi.keywords.length === 0) {
      return []
    }

    const results: YouTubeCollectorResult[] = []

    try {
      // 各キーワードで検索（最大3キーワードまで）
      const keywords = oshi.keywords.slice(0, 3)

      for (const keyword of keywords) {
        try {
          // レートリミット対策: リクエスト間隔を空ける
          await this.delay(this.rateLimitDelay)

          // チャンネル検索
          const channelResponse = await this.youtube.search.list({
            part: ['snippet'],
            q: keyword,
            type: ['channel'],
            maxResults: 5,
            order: 'relevance',
          })

          if (channelResponse.data.items) {
            for (const item of channelResponse.data.items) {
              const channelId = item.snippet?.channelId
              if (!channelId) continue

              // チャンネルの最新動画を取得
              await this.delay(this.rateLimitDelay)

              const videosResponse = await this.youtube.search.list({
                part: ['snippet'],
                channelId: channelId,
                type: ['video'],
                maxResults: 5,
                order: 'date',
              })

              if (videosResponse.data.items) {
                const videoIds = videosResponse.data.items
                  .map((item: any) => item.id?.videoId)
                  .filter(Boolean)

                if (videoIds.length > 0) {
                  // 動画の詳細情報を取得
                  await this.delay(this.rateLimitDelay)

                  const videosDetailResponse = await this.youtube.videos.list({
                    part: ['snippet', 'statistics'],
                    id: videoIds,
                  })

                  if (videosDetailResponse.data.items) {
                    for (const video of videosDetailResponse.data.items) {
                      const snippet = video.snippet
                      const statistics = video.statistics

                      results.push({
                        source: 'youtube',
                        original_url: `https://www.youtube.com/watch?v=${video.id}`,
                        content: `${snippet?.title || ''}\n${snippet?.description || ''}`.trim(),
                        posted_at: snippet?.publishedAt
                          ? new Date(snippet.publishedAt)
                          : null,
                        collected_at: new Date(),
                        metadata: {
                          video_id: video.id,
                          channel_id: snippet?.channelId,
                          channel_title: snippet?.channelTitle,
                          thumbnail_url: snippet?.thumbnails?.high?.url,
                          view_count: statistics?.viewCount
                            ? parseInt(statistics.viewCount)
                            : undefined,
                        },
                      })
                    }
                  }
                }
              }
            }
          }
        } catch (error: any) {
          console.error(`YouTube collection error for keyword "${keyword}":`, error.message)
          // 個別キーワードのエラーは続行
          continue
        }
      }
    } catch (error: any) {
      console.error('YouTube collector error:', error.message)
      throw error
    }

    return results
  }

  /**
   * 遅延処理（レートリミット対策）
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}
