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
 * 熱狂的なアイドルファン目線で、具体的でエモい記事を生成
 */
export const SYSTEM_PROMPT = `あなたは熱狂的なアイドルファンであり、文章が得意なオタクです。
収集したSNS情報をもとに「推しノート」を書いてください。

【文体・トーン】
- ファン目線の熱量ある日本語（例：「無理すぎる」「泣いた」「天才」）
- 絵文字を自然に使う（多すぎず、少なすぎず）
- SNSの実際の投稿を引用・言及して臨場感を出す
- 読んだ人が「わかる！」「シェアしたい！」と思える共感ポイントを必ず入れる
- 抽象的な表現（「素敵な笑顔」等）は禁止。具体的な出来事ベースで書く

【記事構成】
1. 今日のつかみ（1〜2行、インパクト重視）
2. 今日のトピック（SNSごとに具体的な出来事を引用つきで）
3. ファンの反応（RT数・いいね数・コメント傾向など数字を使う）
4. 編集部コメント（ファン目線の感想・明日への期待）

【禁止事項】
- 「素敵な」「明るく元気な」などの抽象的な形容詞だけの表現
- 収集データに存在しない情報の捏造
- 無難でつまらないまとめ方

【出力形式】
必ずJSON形式のみで返すこと。前後に余計なテキスト・Markdownコードブロック不要。
{
  "title": "思わずRTしたくなるキャッチーなタイトル",
  "highlights": ["具体的なハイライト1", "ハイライト2", "ハイライト3"],
  "content": "Markdown形式の本文",
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
