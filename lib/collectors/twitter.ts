/**
 * Twitterコレクター
 * Twitter API v2を使用してツイートを収集
 * 
 * レートリミット:
 * - Recent search: 180 requests/15min (Bearer Token)
 * - 1リクエストあたり最大100ツイート
 */
import { TwitterApi } from 'twitter-api-v2'
import type { Oshi } from '@/types'

interface TwitterCollectorResult {
  source: 'twitter'
  original_url: string
  content: string
  posted_at: Date | null
  collected_at: Date
  metadata?: {
    tweet_id?: string
    author_username?: string
    media_urls?: string[]
  }
}

export class TwitterCollector {
  private client: TwitterApi
  private rateLimitDelay: number = 1000 // 1秒間隔でリクエスト

  constructor() {
    const bearerToken = process.env.TWITTER_BEARER_TOKEN
    if (!bearerToken) {
      throw new Error('TWITTER_BEARER_TOKEN is not set')
    }
    this.client = new TwitterApi(bearerToken)
  }

  /**
   * 推しのキーワードでツイートを検索
   */
  async collect(oshi: Oshi): Promise<TwitterCollectorResult[]> {
    if (!oshi.keywords || oshi.keywords.length === 0) {
      return []
    }

    const results: TwitterCollectorResult[] = []
    const readOnlyClient = this.client.readOnly

    try {
      // 各キーワードで検索（最大5キーワードまで）
      const keywords = oshi.keywords.slice(0, 5)
      
      for (const keyword of keywords) {
        try {
          // レートリミット対策: リクエスト間隔を空ける
          await this.delay(this.rateLimitDelay)

          const searchQuery = `${keyword} -is:retweet lang:ja`
          const tweets = await readOnlyClient.v2.search(searchQuery, {
            max_results: 10, // キーワードあたり10ツイート
            'tweet.fields': ['created_at', 'author_id', 'attachments'],
            'media.fields': ['url', 'preview_image_url', 'type'],
            expansions: ['attachments.media_keys', 'author_id'],
          })

          if (tweets.data?.data) {
            for (const tweet of tweets.data.data) {
              // メディアURLを取得
              const mediaUrls: string[] = []
              if (tweet.attachments?.media_keys && tweets.data.includes?.media) {
                for (const mediaKey of tweet.attachments.media_keys) {
                  const media = tweets.data.includes.media.find(
                    (m: any) => m.media_key === mediaKey
                  )
                  if (media) {
                    if (media.type === 'photo' && media.url) {
                      mediaUrls.push(media.url)
                    } else if (media.type === 'video' && media.preview_image_url) {
                      mediaUrls.push(media.preview_image_url)
                    }
                  }
                }
              }

              const author = tweets.data.includes?.users?.find(
                (u: any) => u.id === tweet.author_id
              )

              results.push({
                source: 'twitter',
                original_url: `https://twitter.com/i/web/status/${tweet.id}`,
                content: tweet.text || '',
                posted_at: tweet.created_at ? new Date(tweet.created_at) : null,
                collected_at: new Date(),
                metadata: {
                  tweet_id: tweet.id,
                  author_username: author?.username,
                  media_urls: mediaUrls.length > 0 ? mediaUrls : undefined,
                },
              })
            }
          }
        } catch (error: any) {
          console.error(`Twitter collection error for keyword "${keyword}":`, error.message)
          // 個別キーワードのエラーは続行
          continue
        }
      }
    } catch (error: any) {
      console.error('Twitter collector error:', error.message)
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
