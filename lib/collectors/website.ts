/**
 * Websiteコレクター
 * cheerio + fetch でWebスクレイピング
 * 公式サイトのニュース・お知らせページをクロール
 * 
 * 注意: スクレイピングは対象サイトの利用規約を確認してください
 * robots.txtも確認し、適切なクロール間隔を設定してください
 */
import * as cheerio from 'cheerio'
import type { Oshi } from '@/types'

interface WebsiteCollectorResult {
  source: 'website'
  original_url: string
  content: string
  posted_at: Date | null
  collected_at: Date
  metadata?: {
    title?: string
    description?: string
    image_url?: string
  }
}

interface WebsiteConfig {
  baseUrl: string
  newsPaths?: string[] // 例: ['/news', '/announcements']
  selectors?: {
    title?: string
    content?: string
    date?: string
    link?: string
  }
}

export class WebsiteCollector {
  private rateLimitDelay: number = 3000 // 3秒間隔でリクエスト
  private maxPages: number = 5 // 最大5ページまでクロール

  /**
   * 推しの公式サイトから情報を収集
   * 注意: 実際の実装では、推しごとに設定されたURLを使用する必要があります
   */
  async collect(oshi: Oshi, config?: WebsiteConfig): Promise<WebsiteCollectorResult[]> {
    const results: WebsiteCollectorResult[] = []

    // 推しのメタデータから公式サイトURLを取得（将来的な拡張）
    // 現時点では、キーワードから推測するか、別途設定が必要
    if (!config) {
      // デフォルト設定（実際の実装では推しごとに設定）
      return []
    }

    try {
      const urlsToCrawl = this.buildUrls(config)

      for (const url of urlsToCrawl.slice(0, this.maxPages)) {
        try {
          // レートリミット対策: リクエスト間隔を空ける
          await this.delay(this.rateLimitDelay)

          const response = await fetch(url, {
            headers: {
              'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
            // タイムアウト設定（10秒）
            signal: AbortSignal.timeout(10000),
          })

          if (!response.ok) {
            console.warn(`Failed to fetch ${url}: ${response.status}`)
            continue
          }

          const html = await response.text()
          const $ = cheerio.load(html)

          // タイトルを取得
          const title =
            $(config.selectors?.title || 'h1, title').first().text().trim() ||
            $('meta[property="og:title"]').attr('content') ||
            ''

          // コンテンツを取得
          const content =
            $(config.selectors?.content || 'article, .content, main').first().text().trim() ||
            $('meta[property="og:description"]').attr('content') ||
            ''

          // 日付を取得
          let postedAt: Date | null = null
          if (config.selectors?.date) {
            const dateText = $(config.selectors.date).first().text().trim()
            if (dateText) {
              postedAt = this.parseDate(dateText)
            }
          }
          // メタデータから日付を取得
          if (!postedAt) {
            const metaDate = $('meta[property="article:published_time"]').attr('content')
            if (metaDate) {
              postedAt = new Date(metaDate)
            }
          }

          // 画像URLを取得
          const imageUrl =
            $('meta[property="og:image"]').attr('content') ||
            $('img').first().attr('src') ||
            undefined

          if (title || content) {
            results.push({
              source: 'website',
              original_url: url,
              content: `${title}\n\n${content}`.trim(),
              posted_at: postedAt,
              collected_at: new Date(),
              metadata: {
                title: title || undefined,
                description: content.length > 200 ? content.substring(0, 200) + '...' : content,
                image_url: imageUrl,
              },
            })
          }

          // リンクを取得して再帰的にクロール（オプション）
          if (config.selectors?.link) {
            const links = $(config.selectors.link)
              .map((_, el) => $(el).attr('href'))
              .get()
              .filter(Boolean)
              .map((href) => {
                if (href?.startsWith('http')) return href
                if (href?.startsWith('/')) {
                  return new URL(href, config.baseUrl).toString()
                }
                return null
              })
              .filter(Boolean) as string[]

            // リンクのクロールは実装を簡略化（実際はキュー管理が必要）
          }
        } catch (error: any) {
          console.error(`Website collection error for ${url}:`, error.message)
          // 個別URLのエラーは続行
          continue
        }
      }
    } catch (error: any) {
      console.error('Website collector error:', error.message)
      throw error
    }

    return results
  }

  /**
   * クロール対象URLを構築
   */
  private buildUrls(config: WebsiteConfig): string[] {
    const urls: string[] = []

    // ベースURLを追加
    urls.push(config.baseUrl)

    // ニュースパスを追加
    if (config.newsPaths) {
      for (const path of config.newsPaths) {
        urls.push(new URL(path, config.baseUrl).toString())
      }
    }

    return urls
  }

  /**
   * 日付文字列をパース
   */
  private parseDate(dateText: string): Date | null {
    try {
      // 日本語の日付形式に対応
      const date = new Date(dateText)
      if (!isNaN(date.getTime())) {
        return date
      }

      // その他の形式を試行
      // 例: "2024年3月9日" -> "2024/3/9"
      const normalized = dateText
        .replace(/年/g, '/')
        .replace(/月/g, '/')
        .replace(/日/g, '')
        .replace(/\s+/g, '')

      const parsed = new Date(normalized)
      if (!isNaN(parsed.getTime())) {
        return parsed
      }
    } catch {
      // パース失敗
    }

    return null
  }

  /**
   * 遅延処理（レートリミット対策）
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}
