# AI記事生成機能

Claude APIを使用して推しノート記事を自動生成する機能です。

## 処理フロー

1. **情報収集**: `raw_posts`から当日収集した推しの投稿を取得
2. **記事生成**: Claude APIに渡して記事を生成
3. **保存**: 生成結果を`articles`テーブルに保存

## 実装ファイル

- `prompts.ts`: プロンプトテンプレート管理
- `articleGenerator.ts`: メイン生成ロジック
- `app/api/cron/generate/route.ts`: 記事生成バッチエンドポイント

## プロンプト要件

### システムプロンプト
- アイドルファン向けの温かみのある日本語文体
- ファンとして一緒に喜ぶような感情表現
- 絵文字を適切に使用

### 生成する記事の構成
- **タイトル**: キャッチーで感情的
- **ハイライト**: 3〜5個の箇条書き
- **本文**: 見出しつきMarkdown形式、500〜800文字
- **情報ソースリンク**: 収集元のURLとラベルを一覧化

## 出力形式

Claude APIからの返答はJSON形式で受け取ります:

```json
{
  "title": "記事タイトル",
  "highlights": ["ハイライト1", "ハイライト2"],
  "content": "Markdown本文",
  "source_links": [
    {"label": "ソース名", "url": "URL"}
  ]
}
```

## モデル

- `claude-sonnet-4-20250514` を使用
- ストリーミングは使用せず、通常のAPI呼び出し

## 実行スケジュール

- Vercel Cron Jobsで毎朝7時に自動実行
- 情報収集（6時）の後に実行される

## ローカルテスト

```bash
# 環境変数を設定
export CRON_SECRET=your_cron_secret_key
export ANTHROPIC_API_KEY=your_anthropic_api_key

# 記事生成バッチを実行
curl -X POST http://localhost:3000/api/cron/generate \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## エラーハンドリング

- 各推しの記事生成は個別にtry-catchで処理
- 1つの推しでエラーが発生しても他の推しは継続実行
- エラーはログに記録され、APIレスポンスに含まれる

## 重複チェック

- 同じ推しで当日の記事が既にある場合は更新
- ない場合は新規作成
