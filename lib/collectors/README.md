# 情報収集バッチ処理

推しの情報を自動的に収集するバッチ処理システムです。

## アーキテクチャ

- **Vercel Cron Jobs**: 毎朝6時に自動実行
- **コレクター**: 各SNS/プラットフォームから情報を収集
- **オーケストレーター**: 全コレクターを統合管理
- **データ保存**: `raw_posts`テーブルに保存（重複チェック付き）

## コレクター

### 1. Twitterコレクター (`twitter.ts`)
- Twitter API v2を使用
- キーワード検索で最新ツイートを取得
- 画像・動画URLも収集

**レートリミット**:
- Recent search: 180 requests/15min
- 1リクエストあたり最大100ツイート

### 2. YouTubeコレクター (`youtube.ts`)
- YouTube Data API v3を使用
- チャンネル検索・動画情報取得

**レートリミット**:
- 10,000 units/day（デフォルト）
- Search: 100 units/request
- Videos: 1 unit/request

### 3. Websiteコレクター (`website.ts`)
- `cheerio` + `fetch` でWebスクレイピング
- 公式サイトのニュース・お知らせページをクロール

**注意事項**:
- 対象サイトの利用規約を確認
- robots.txtを確認
- 適切なクロール間隔を設定

## セットアップ

### 1. 環境変数の設定

`.env.local`に以下を追加:

```bash
# Twitter API v2
TWITTER_BEARER_TOKEN=your_twitter_bearer_token

# YouTube Data API v3
YOUTUBE_API_KEY=your_youtube_api_key

# Vercel Cron認証
CRON_SECRET=your_cron_secret_key
```

### 2. APIキーの取得

#### Twitter API
1. https://developer.twitter.com/en/portal/dashboard にアクセス
2. プロジェクトを作成
3. Bearer Tokenを取得

#### YouTube Data API
1. https://console.cloud.google.com/apis/credentials にアクセス
2. APIを有効化
3. APIキーを作成

### 3. Vercel Cronの設定

`vercel.json`で設定済み:
```json
{
  "crons": [
    {
      "path": "/api/cron/collect",
      "schedule": "0 6 * * *"
    }
  ]
}
```

## ローカルテスト

### 方法1: curlコマンド

```bash
curl -X POST http://localhost:3000/api/cron/collect \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### 方法2: 手動実行スクリプト

`scripts/test-collector.ts`を作成して実行（将来的な拡張）

## 実行フロー

1. Vercel Cronが `/api/cron/collect` を呼び出し
2. オーケストレーターが全推しを取得
3. 各推しに対して各コレクターを並列実行
4. 収集したデータを`raw_posts`テーブルに保存（重複チェック）
5. ログを記録

## エラーハンドリング

- 各コレクターは個別にtry-catchでエラーを処理
- 1つのコレクターでエラーが発生しても他のコレクターは継続実行
- エラーはログに記録され、APIレスポンスに含まれる

## レートリミット対策

- 各コレクターにリクエスト間隔を設定
- Twitter: 1秒間隔
- YouTube: 2秒間隔
- Website: 3秒間隔

## ログ

収集結果は以下の形式でログに記録されます:

```
=== Collection Log ===
Date: 2024-03-09T06:00:00.000Z
Total Oshi: 5
Total Collected: 42
Results: [...]
Errors: None
===================
```

## トラブルシューティング

### バッチが実行されない
- Vercel DashboardのCron Jobsセクションで確認
- 環境変数が正しく設定されているか確認

### レートリミットエラー
- リクエスト間隔を調整
- APIキーのクォータを確認

### データが保存されない
- SupabaseのRLSポリシーを確認
- データベース接続を確認
