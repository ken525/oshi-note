/**
 * AI記事生成ロジック
 * Claude APIを使用して推しノート記事を生成
 */
import { createClient } from '@/lib/supabase/server'
import { anthropic } from '@/lib/claude/client'
import { SYSTEM_PROMPT } from './prompts'
import type { Oshi, RawPost } from '@/types'
import type { CollectedPost } from '@/types/collector'

const truncate = (text: string, max: number) =>
  text.length > max ? text.slice(0, max) + '...' : text

function buildUserMessage(oshiName: string, date: string, posts: CollectedPost[]): string {
  const postsBySource = posts.reduce((acc, post) => {
    if (!acc[post.source]) acc[post.source] = []
    acc[post.source].push(post)
    return acc
  }, {} as Record<string, CollectedPost[]>)

  const sections = Object.entries(postsBySource).map(([source, sourcePosts]) => {
    const sourceLabel: Record<string, string> = {
      twitter: 'X',
      instagram: 'Instagram',
      tiktok: 'TikTok',
      youtube: 'YouTube',
      website: '公式サイト',
    }
    const label = sourceLabel[source] ?? source
    // 最新順で最大3件
    const sorted = [...sourcePosts].sort(
      (a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime()
    )
    const limited = sorted.slice(0, 3)

    const postDetails = limited
      .map((p) => {
        const metrics = [
          p.metrics.likes ? `いいね${p.metrics.likes}` : '',
          p.metrics.retweets ? `RT${p.metrics.retweets}` : '',
          p.metrics.views ? `再生${p.metrics.views}` : '',
          p.metrics.comments ? `コメント${p.metrics.comments}` : '',
        ]
          .filter(Boolean)
          .join('・')

        return [
          `・"${truncate(p.content, 200)}"`,
          metrics ? `　${metrics}` : '',
          `　${p.url}`,
        ]
          .filter(Boolean)
          .join('\n')
      })
      .join('\n')

    return `[${label}]\n${postDetails}`
  })

  return `推し:${oshiName} 日付:${date}\n\n${sections.join('\n\n')}`
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
  private model: string = 'claude-haiku-4-5-20251001'
  private maxTokens: number = 4000

  /**
   * RawPostをCollectedPostに変換
   * 注意: 現在のデータベーススキーマにはmetadataカラムがないため、
   * メトリクス情報は将来的に追加されることを想定
   */
  private convertToCollectedPost(rawPost: RawPost & { metadata?: any }): CollectedPost {
    // metadataが存在する場合（将来的な拡張やテストデータ用）
    const metadata = rawPost.metadata || {}
    const postedAt = rawPost.posted_at
      ? (typeof rawPost.posted_at === 'string' ? rawPost.posted_at : rawPost.posted_at.toISOString())
      : new Date().toISOString()

    return {
      source: rawPost.source,
      content: rawPost.content,
      url: rawPost.original_url,
      postedAt,
      metrics: {
        likes: metadata.likes || metadata.favorite_count || undefined,
        retweets: metadata.retweets || metadata.retweet_count || undefined,
        views: metadata.views || metadata.view_count || undefined,
        comments: metadata.comments || metadata.reply_count || undefined,
      },
      mediaUrls: metadata.media_urls || metadata.mediaUrls || undefined,
    }
  }

  /**
   * 推しの情報を基に記事を生成
   * @param options.publishedDate 記事の対象日（プロンプトの日付に使用。未指定時は今日）
   */
  async generate(
    oshi: Oshi,
    rawPosts: RawPost[],
    options?: { publishedDate?: string }
  ): Promise<ArticleGenerationResult> {
    if (rawPosts.length === 0) {
      return {
        success: false,
        error: '収集した情報がありません',
      }
    }

    try {
      // Claude APIクライアントの確認
      if (!anthropic) {
        return {
          success: false,
          error: 'ANTHROPIC_API_KEYが設定されていません。.env.localファイルにANTHROPIC_API_KEYを設定してください。',
        }
      }

      // RawPostをCollectedPostに変換
      const collectedPosts: CollectedPost[] = rawPosts.map(post => this.convertToCollectedPost(post))

      const date =
        options?.publishedDate ?? new Date().toISOString().split('T')[0]
      const userPrompt = buildUserMessage(oshi.name, date, collectedPosts)

      const inputChars = SYSTEM_PROMPT.length + userPrompt.length
      const estimatedInputTokens = Math.ceil(inputChars / 4)
      console.log('[ArticleGenerator] estimated input tokens:', estimatedInputTokens, '(chars:', inputChars, ')')

      // Claude APIを呼び出し
      let response
      try {
        response = await anthropic.messages.create({
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
      if ((response as any).usage) {
        const u = (response as any).usage
        console.log('[ArticleGenerator] token usage:', {
          input_tokens: u.input_tokens,
          output_tokens: u.output_tokens,
        })
      }
      } catch (apiError: any) {
        // APIエラーを分かりやすく処理
        console.error('Claude API Error:', {
          status: apiError.status,
          message: apiError.message,
          error: apiError.error,
          fullError: apiError,
        })
        
        const errorMessage = apiError.message || String(apiError)
        const errorBody = apiError.error || {}
        const errorType = errorBody.type || ''
        const errorDetail = errorBody.message || errorMessage
        
        // クレジット残高不足のエラー
        if (
          errorMessage.includes('credit balance') ||
          errorMessage.includes('too low') ||
          errorDetail.includes('credit balance') ||
          errorDetail.includes('too low')
        ) {
          return {
            success: false,
            error: 'Anthropic APIのクレジット残高が不足しています。クレジットを追加した場合は、数分待ってから再度お試しください。https://console.anthropic.com で残高を確認してください。',
          }
        }
        
        // 認証エラー
        if (
          errorMessage.includes('invalid x-api-key') ||
          errorMessage.includes('authentication') ||
          errorType.includes('authentication')
        ) {
          return {
            success: false,
            error: 'Anthropic APIキーが無効です。.env.localファイルのANTHROPIC_API_KEYを確認してください。',
          }
        }
        
        // その他のエラー
        return {
          success: false,
          error: `Anthropic APIエラー: ${errorDetail || errorMessage}`,
        }
      }

      // レスポンスからテキストを取得
      const text = this.extractTextFromResponse(response)

      if (!text) {
        return {
          success: false,
          error: 'Claude APIからの応答が空です',
        }
      }

      // JSON形式でパース
      let article: GeneratedArticle
      try {
        const parsed = this.parseArticleResponse(text)
        if (!parsed) {
          throw new Error('記事のパース結果がnullです')
        }
        article = parsed
      } catch (parseError: any) {
        console.error('Parse error:', parseError)
        return {
          success: false,
          error: parseError.message || '記事のパースに失敗しました',
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
   * JSONコードブロックを除去してからパース
   */
  private parseArticleResponse(text: string): GeneratedArticle | null {
    try {
      // ```json ... ``` のコードブロックを除去
      let cleaned = text.replace(/```json\n?/g, '').replace(/\n?```/g, '').trim()
      
      // 前後の余計なテキストを除去（JSONオブジェクトのみを抽出）
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        cleaned = jsonMatch[0]
      }

      // JSONとしてパース
      const parsed = JSON.parse(cleaned)
      return this.validateArticle(parsed)
    } catch (error) {
      console.error('Article JSON parse error:', error)
      console.error('Raw response:', text)
      
      // パース失敗時はエラーを投げる（フォールバックは呼び出し側で処理）
      throw new Error('記事の生成に失敗しました: JSONパースエラー')
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

/**
 * 指定日の記事を1本生成してDBに保存する
 * raw_posts: ①その日の posted_at → ②その日の collected_at → ③直近の収集分
 * いずれも無い場合のみダミーで生成（開発・デモ用）
 * 呼び出し元に成功/失敗とエラーメッセージを返す
 */
export async function generateArticleForDate(
  oshiId: string,
  date: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const { data: oshi, error: oshiError } = await supabase
    .from('oshi')
    .select('*')
    .eq('id', oshiId)
    .single()

  if (oshiError || !oshi) {
    const message = `[generateArticleForDate] oshi not found: ${oshiId}`
    console.error(message, oshiError)
    return { success: false, error: '推しが見つかりません' }
  }

  const dayStart = `${date}T00:00:00.000Z`
  const dayEnd = `${date}T23:59:59.999Z`

  let posts: RawPost[] = []

  const { data: byPosted } = await supabase
    .from('raw_posts')
    .select('*')
    .eq('oshi_id', oshiId)
    .gte('posted_at', dayStart)
    .lte('posted_at', dayEnd)

  if (byPosted && byPosted.length > 0) {
    posts = byPosted as RawPost[]
  } else {
    const { data: byCollected } = await supabase
      .from('raw_posts')
      .select('*')
      .eq('oshi_id', oshiId)
      .gte('collected_at', dayStart)
      .lte('collected_at', dayEnd)

    if (byCollected && byCollected.length > 0) {
      posts = byCollected as RawPost[]
    } else {
      const { data: recent } = await supabase
        .from('raw_posts')
        .select('*')
        .eq('oshi_id', oshiId)
        .order('collected_at', { ascending: false })
        .limit(50)

      if (recent && recent.length > 0) {
        posts = recent as RawPost[]
      }
    }
  }

  if (posts.length === 0) {
    posts = createDummyRawPostsForDate(oshiId, date)
  }

  const generator = new ArticleGenerator()
  const result = await generator.generate(oshi as Oshi, posts, {
    publishedDate: date,
  })
  if (!result.success || !result.article) {
    console.error(
      `[generateArticleForDate] generation failed for ${oshiId} ${date}:`,
      result.error
    )
    return {
      success: false,
      error: result.error || '記事生成に失敗しました',
    }
  }

  const { data: existing } = await supabase
    .from('articles')
    .select('id')
    .eq('oshi_id', oshiId)
    .eq('user_id', (oshi as any).user_id)
    .eq('published_date', date)
    .maybeSingle()

  if (existing) {
    return { success: true }
  }

  await supabase.from('articles').insert({
    user_id: (oshi as any).user_id,
    oshi_id: oshiId,
    title: result.article.title,
    content: result.article.content,
    highlights: result.article.highlights,
    source_links: result.article.source_links,
    published_date: date,
  } as any)

  return { success: true }
}

function createDummyRawPostsForDate(oshiId: string, date: string): RawPost[] {
  const base = `${date}T12:00:00.000Z`
  return [
    {
      id: `dummy-${oshiId}-${date}-1`,
      oshi_id: oshiId,
      source: 'twitter',
      original_url: 'https://x.com/example/status/1',
      content: '推しの近況やファンへの感謝の気持ちをまとめたダミー投稿です。',
      posted_at: base,
      collected_at: base,
      metadata: { likes: 100, retweets: 10 },
    },
    {
      id: `dummy-${oshiId}-${date}-2`,
      oshi_id: oshiId,
      source: 'website',
      original_url: 'https://example.com/news/1',
      content: '公式お知らせやイベント情報のダミーです。',
      posted_at: base,
      collected_at: base,
      metadata: {},
    },
  ] as RawPost[]
}

/**
 * 推し登録時に直近3日分の記事を自動生成する
 */
export async function generateInitialArticles(oshiId: string): Promise<void> {
  const today = new Date()
  const dates = [0, 1, 2].map((i) => {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    return d.toISOString().split('T')[0]
  })

  for (const date of dates) {
    try {
      const result = await generateArticleForDate(oshiId, date)
      if (!result.success) {
        console.error(
          `[generateInitialArticles] generation failed for ${oshiId} ${date}:`,
          result.error
        )
      }
    } catch (err) {
      console.error(`[generateInitialArticles] failed for ${oshiId} ${date}:`, err)
    }
  }
}
