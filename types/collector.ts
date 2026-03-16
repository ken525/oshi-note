/**
 * コレクター関連の型定義
 */

export type CollectedPost = {
  source: 'twitter' | 'instagram' | 'tiktok' | 'youtube' | 'website'
  content: string        // 投稿テキスト
  url: string           // 元投稿URL
  postedAt: string      // 投稿日時
  metrics: {
    likes?: number
    retweets?: number
    views?: number
    comments?: number
  }
  mediaUrls?: string[]  // 画像・動画URL
}
