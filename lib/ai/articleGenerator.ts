/**
 * AI記事生成ロジック
 * Claude APIを使用して推しノート記事を生成
 */
import { anthropic } from '@/lib/claude/client'
import { SYSTEM_PROMPT, generateUserPrompt } from './prompts'
import type { Oshi } from '@/types'

interface RawPost {
  source: 'twitter' | 'instagram' | 'tiktok' | 'youtube' | 'website'
  original_url: string
  content: string
  posted_at: string | Date | null
  collected_at: string | Date
  metadata?: any
}

interface GeneratedArticle {
  title: string
  highlights: string[]
  content: string
  source_links: Array<{ label: string; url: string }>
}

interface ArticleGenerationResult {
  success: boolean
  article?: GeneratedArticle
  error?: string
}

export class ArticleGenerator {
  private model: string = 'claude-sonnet-4-20250514'
  private maxTokens: number = 4000

  /**
   * 推しの情報を基に記事を生成
   */
  async generate(oshi: Oshi, rawPosts: RawPost[]): Promise<ArticleGenerationResult> {
    if (rawPosts.length === 0) {
      return {
        success: false,
        error: '収集した情報がありません',
      }
    }

    try {
      // プロンプトを生成
      const userPrompt = generateUserPrompt(
        {
          name: oshi.name,
          group_name: oshi.group_name,
        },
        rawPosts
      )

      // Claude APIを呼び出し
      const response = await anthropic.messages.create({
        model: this.model,
        max_tokens: this.maxTokens,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: userPrompt,
          },
        ],
      })

      // レスポンスからテキストを取得
      const text = this.extractTextFromResponse(response)

      if (!text) {
        return {
          success: false,
          error: 'Claude APIからの応答が空です',
        }
      }

      // JSON形式でパース
      const article = this.parseArticleResponse(text)

      if (!article) {
        return {
          success: false,
          error: '記事のパースに失敗しました',
        }
      }

      return {
        success: true,
        article,
      }
    } catch (error: any) {
      console.error('Article generation error:', error)
      return {
        success: false,
        error: error.message || '記事生成に失敗しました',
      }
    }
  }

  /**
   * Claude APIのレスポンスからテキストを抽出
   */
  private extractTextFromResponse(response: any): string | null {
    if (!response.content || !Array.isArray(response.content)) {
      return null
    }

    // 最初のテキストブロックを取得
    const textBlock = response.content.find(
      (block: any) => block.type === 'text'
    )

    return textBlock?.text || null
  }

  /**
   * Claude APIの応答をパースして記事データを取得
   */
  private parseArticleResponse(text: string): GeneratedArticle | null {
    try {
      // JSONコードブロックを探す
      const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || 
                       text.match(/```\s*([\s\S]*?)\s*```/)

      if (jsonMatch) {
        const jsonText = jsonMatch[1].trim()
        const parsed = JSON.parse(jsonText)
        return this.validateArticle(parsed)
      }

      // JSONコードブロックがない場合、直接JSONとしてパースを試行
      try {
        const parsed = JSON.parse(text.trim())
        return this.validateArticle(parsed)
      } catch {
        // JSONとしてパースできない場合、テキストから情報を抽出
        return this.extractArticleFromText(text)
      }
    } catch (error) {
      console.error('Failed to parse article response:', error)
      return null
    }
  }

  /**
   * 記事データのバリデーション
   */
  private validateArticle(data: any): GeneratedArticle | null {
    if (!data || typeof data !== 'object') {
      return null
    }

    const article: GeneratedArticle = {
      title: data.title || '記事タイトル',
      highlights: Array.isArray(data.highlights) ? data.highlights : [],
      content: data.content || '',
      source_links: Array.isArray(data.source_links)
        ? data.source_links.filter(
            (link: any) => link && link.url && link.label
          )
        : [],
    }

    // 必須フィールドのチェック
    if (!article.title || !article.content) {
      return null
    }

    return article
  }

  /**
   * テキストから記事データを抽出（フォールバック）
   */
  private extractArticleFromText(text: string): GeneratedArticle | null {
    // タイトルを抽出（最初の行または#で始まる行）
    const titleMatch = text.match(/^#\s*(.+)$/m) || 
                       text.match(/^(.+)$/m)
    const title = titleMatch ? titleMatch[1].trim() : '記事タイトル'

    // ハイライトを抽出（- または * で始まる行）
    const highlightMatches = text.match(/^[-*]\s*(.+)$/gm)
    const highlights = highlightMatches
      ? highlightMatches
          .slice(0, 5)
          .map((match) => match.replace(/^[-*]\s*/, '').trim())
      : []

    // 本文を抽出（タイトルとハイライトを除いた部分）
    let content = text
    if (titleMatch) {
      content = content.replace(titleMatch[0], '')
    }
    highlights.forEach((highlight) => {
      content = content.replace(`- ${highlight}`, '')
      content = content.replace(`* ${highlight}`, '')
    })
    content = content.trim()

    // ソースリンクを抽出（URLを含む行）
    const urlRegex = /https?:\/\/[^\s]+/g
    const urls = text.match(urlRegex) || []
    const source_links = urls.slice(0, 10).map((url, index) => ({
      label: `ソース${index + 1}`,
      url,
    }))

    return {
      title,
      highlights: highlights.length > 0 ? highlights : ['重要なポイント'],
      content: content || '記事の内容',
      source_links,
    }
  }
}
