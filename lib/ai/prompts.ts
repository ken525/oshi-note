/**
 * プロンプトテンプレート管理
 * Claude APIへのプロンプトを生成
 */

interface RawPost {
  source: 'twitter' | 'instagram' | 'tiktok' | 'youtube' | 'website'
  original_url: string
  content: string
  posted_at: string | Date | null
  metadata?: any
}

interface OshiInfo {
  name: string
  group_name?: string | null
}

/**
 * システムプロンプト
 * アイドルファン向けの温かみのある日本語文体で記事を生成
 */
export const SYSTEM_PROMPT = `あなたはアイドルファン向けの記事を書くライターです。
以下の要件に従って、温かみのある日本語で記事を作成してください。

【文体の要件】
- ファンとして一緒に喜ぶような感情表現を使用
- 絵文字を適切に使用（過度に使用しない）
- 親しみやすく、温かみのある表現
- アイドルへの愛情と応援の気持ちを込める

【記事の構成】
1. タイトル: キャッチーで感情的、読者の興味を引く
2. ハイライト: 3〜5個の箇条書きで重要なポイントをまとめる
3. 本文: 見出しつきMarkdown形式、500〜800文字
   - 導入部: 推しの名前やグループ名を自然に含める
   - 本文: 収集した情報を基に、ファン目線で解説
   - まとめ: 応援メッセージを含める
4. 情報ソースリンク: 収集元のURLとラベルを一覧化

【出力形式】
以下のJSON形式で出力してください：
{
  "title": "記事タイトル",
  "highlights": ["ハイライト1", "ハイライト2", "ハイライト3"],
  "content": "Markdown形式の本文",
  "source_links": [
    {"label": "ソース名（例: Twitter投稿）", "url": "URL"}
  ]
}`

/**
 * ユーザープロンプトを生成
 */
export function generateUserPrompt(oshi: OshiInfo, rawPosts: RawPost[]): string {
  const oshiName = oshi.name
  const groupName = oshi.group_name ? `（${oshi.group_name}）` : ''
  
  let prompt = `【推し情報】
名前: ${oshiName}${groupName}

【収集した情報】
以下の情報を基に、推しに関する記事を作成してください。

`

  // 各ソースごとに情報を整理
  const postsBySource: Record<string, RawPost[]> = {}
  for (const post of rawPosts) {
    if (!postsBySource[post.source]) {
      postsBySource[post.source] = []
    }
    postsBySource[post.source].push(post)
  }

  // ソースごとに情報を表示
  for (const [source, posts] of Object.entries(postsBySource)) {
    const sourceLabel = getSourceLabel(source as RawPost['source'])
    prompt += `\n## ${sourceLabel}\n\n`
    
    for (const post of posts) {
      const postedAt = post.posted_at 
        ? (typeof post.posted_at === 'string' ? new Date(post.posted_at) : post.posted_at)
        : null
      prompt += `- **投稿日時**: ${postedAt ? postedAt.toLocaleString('ja-JP') : '不明'}\n`
      prompt += `- **URL**: ${post.original_url}\n`
      prompt += `- **内容**: ${post.content.substring(0, 500)}${post.content.length > 500 ? '...' : ''}\n\n`
    }
  }

  prompt += `\n【記事作成の指示】
上記の情報を基に、推し「${oshiName}${groupName}」に関する記事を作成してください。
複数のソースから情報を統合し、ファンが喜ぶような内容にしてください。
重複する情報はまとめて、重要なポイントをハイライトとして抽出してください。`

  return prompt
}

/**
 * ソース名を日本語ラベルに変換
 */
function getSourceLabel(source: RawPost['source']): string {
  const labels: Record<RawPost['source'], string> = {
    twitter: 'Twitter',
    instagram: 'Instagram',
    tiktok: 'TikTok',
    youtube: 'YouTube',
    website: '公式サイト',
  }
  return labels[source] || source
}
