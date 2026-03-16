/**
 * プロンプトテンプレート管理
 * Claude APIへのプロンプトを生成
 */

import type { CollectedPost } from '@/types/collector'

interface OshiInfo {
  name: string
  group_name?: string | null
}

/**
 * システムプロンプト
 * ファクトベースでAIの解釈・感情・コメントを排除し、収集情報をそのまま整理する
 */
export const SYSTEM_PROMPT = `あなたは情報整理の専門家です。
収集したSNS・メディア情報を、ファクトベースで過不足なく整理してください。

【絶対に禁止すること】
- AIや編集者としての感想・解釈・コメントを書くこと
  （例：「無理すぎる」「天才すぎる」「脱帽」「編集部より」等）
- 収集データに存在しない情報・推測・補足を書くこと
- 感情的な表現・誇張表現を使うこと

【やること】
- 各SNS・メディアの投稿内容をそのまま引用・要約する
- いいね数・RT数・再生数などの数字はそのまま記載する
- 投稿の事実（何を投稿したか）だけを書く
- 複数ソースの情報を時系列または重要度順に並べる

【記事構成】
1. 今日のサマリー（1〜2行、その日の主なトピックを箇条書き）
2. ソース別ファクト（各SNSの投稿内容・数字をそのまま記載）
3. ソースリンク一覧

【出力形式】
必ずJSON形式のみで返すこと。前後に余計なテキスト・Markdownコードブロック不要。
{
  "title": "今日の主なトピックを端的に表したタイトル（感情表現なし）",
  "highlights": ["ファクトのみのハイライト1", "ハイライト2", "ハイライト3"],
  "content": "Markdown形式の本文（引用・数字ベース）",
  "source_links": [{"label": "ソース名", "url": "URL"}]
}`

/**
 * ユーザープロンプトを生成
 * 収集したSNSデータを具体的なフォーマットでClaudeに渡す
 */
export function generateUserPrompt(oshi: OshiInfo, posts: CollectedPost[]): string {
  const oshiName = oshi.name
  const groupName = oshi.group_name ? `（${oshi.group_name}）` : ''
  const today = new Date().toISOString().split('T')[0]

  // ソースごとにグループ化
  const postsBySource = posts.reduce((acc, post) => {
    if (!acc[post.source]) acc[post.source] = []
    acc[post.source].push(post)
    return acc
  }, {} as Record<string, CollectedPost[]>)

  // 各ソースごとに詳細情報を整形
  const sections = Object.entries(postsBySource).map(([source, sourcePosts]) => {
    const sourceLabel = {
      twitter: 'X（Twitter）',
      instagram: 'Instagram',
      tiktok: 'TikTok',
      youtube: 'YouTube',
      website: '公式サイト'
    }[source as CollectedPost['source']] || source

    const postDetails = sourcePosts.map(p => {
      const postedAt = new Date(p.postedAt).toLocaleString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })

      let detail = `- 投稿内容: "${p.content}"\n`
      detail += `- URL: ${p.url}\n`
      detail += `- 投稿日時: ${postedAt}\n`
      
      if (p.metrics.likes) {
        detail += `- いいね数: ${p.metrics.likes.toLocaleString()}\n`
      }
      if (p.metrics.retweets) {
        detail += `- RT数: ${p.metrics.retweets.toLocaleString()}\n`
      }
      if (p.metrics.views) {
        detail += `- 再生数: ${p.metrics.views.toLocaleString()}回\n`
      }
      if (p.metrics.comments) {
        detail += `- コメント数: ${p.metrics.comments.toLocaleString()}\n`
      }
      if (p.mediaUrls && p.mediaUrls.length > 0) {
        detail += `- メディア: ${p.mediaUrls.length}件\n`
      }

      return detail.trim()
    }).join('\n\n')

    return `【${sourceLabel}】\n${postDetails}`
  })

  return `【推し名】${oshiName}${groupName}
【対象日】${today}

${sections.join('\n\n')}`
}
