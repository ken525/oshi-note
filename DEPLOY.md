# Vercelデプロイ手順

## 1. Gitリポジトリの準備

```bash
# 変更をステージング
git add .

# コミット
git commit -m "Initial commit: 推しノートアプリ"

# GitHubリポジトリを作成してプッシュ（まだリポジトリがない場合）
# GitHubでリポジトリを作成後:
git remote add origin https://github.com/your-username/oshi-note.git
git push -u origin master
```

## 2. Vercelアカウントの準備

1. [Vercel](https://vercel.com) にアクセス
2. GitHubアカウントでサインアップ/ログイン
3. 「Add New Project」をクリック

## 3. Vercelにプロジェクトをインポート

1. GitHubリポジトリを選択
2. プロジェクト設定:
   - **Framework Preset**: Next.js（自動検出されるはず）
   - **Root Directory**: `./`（デフォルト）
   - **Build Command**: `npm run build`（デフォルト）
   - **Output Directory**: `.next`（デフォルト）
   - **Install Command**: `npm install`（デフォルト）

## 4. 環境変数の設定

Vercelのプロジェクト設定で、以下の環境変数を設定してください：

### Supabase設定
```
NEXT_PUBLIC_SUPABASE_URL=https://uohoxlpglyjzaxrpmlsy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvaG94bHBnbHlqemF4cnBtbHN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwNTIxOTEsImV4cCI6MjA4ODYyODE5MX0.FXCw8i7RH56ev8CJ14cXVgdmm0smSkjaDFY4gw0b3nM
```

### Stripe設定（後で設定）
```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_PRICE_ID=price_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

### その他（必要に応じて）
```
NEXT_PUBLIC_APP_URL=https://your-project.vercel.app
ANTHROPIC_API_KEY=your_anthropic_api_key
TWITTER_BEARER_TOKEN=your_twitter_bearer_token
YOUTUBE_API_KEY=your_youtube_api_key
CRON_SECRET=your_cron_secret_key
```

**重要**: `NEXT_PUBLIC_APP_URL` はデプロイ後に自動的に設定されるURLを使用してください。

## 5. デプロイ実行

1. 「Deploy」ボタンをクリック
2. ビルドが完了するまで待機（通常2-5分）
3. デプロイが完了すると、URLが表示されます（例: `https://oshi-note.vercel.app`）

## 6. デプロイ後の確認

### ビルドログの確認
- ビルドエラーがないか確認
- 警告があれば確認

### 動作確認
1. デプロイされたURLにアクセス
2. ログインページが表示されるか確認
3. 基本的な動作を確認

## 7. Stripe Webhook設定

デプロイが完了したら、以下の手順でStripe Webhookを設定：

1. Stripeダッシュボード > Developers > Webhooks
2. 「Add endpoint」をクリック
3. **Endpoint URL**: `https://your-project.vercel.app/api/stripe/webhook`
4. **Events to send**:
   - `checkout.session.completed`
   - `customer.subscription.deleted`
5. 「Add endpoint」をクリック
6. **Signing secret**をコピーして、Vercelの環境変数 `STRIPE_WEBHOOK_SECRET` に設定
7. Vercelで再デプロイ（環境変数を追加したため）

## 8. カスタムドメイン設定（オプション）

1. Vercelプロジェクト設定 > Domains
2. ドメインを追加
3. DNS設定を更新

## トラブルシューティング

### ビルドエラー
- TypeScriptの型エラーを確認
- 環境変数が正しく設定されているか確認

### 環境変数が反映されない
- Vercelで環境変数を設定後、再デプロイが必要
- `NEXT_PUBLIC_` で始まる変数はクライアント側でも使用可能

### Supabase接続エラー
- RLSポリシーが正しく設定されているか確認
- 環境変数が正しく設定されているか確認
