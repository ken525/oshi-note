# 新しいVercelアカウントでのデプロイ手順

## ステップ1: Vercel CLIでログイン

```bash
vercel logout  # 既存のアカウントからログアウト
vercel login   # 新しいアカウントでログイン（ブラウザが開きます）
```

## ステップ2: プロジェクトをデプロイ

```bash
vercel
```

質問に答える：
- Set up and deploy? → **Yes**
- Which scope? → **新しいアカウントを選択**
- Link to existing project? → **No**
- What's your project's name? → **oshi-note-app**（または任意の名前）
- In which directory is your code located? → **./**
- Want to modify these settings? → **No**（デフォルト設定でOK）

## ステップ3: 環境変数を設定

デプロイ後、Vercelダッシュボードで環境変数を設定：

1. [Vercel Dashboard](https://vercel.com/dashboard) にアクセス
2. プロジェクトを選択
3. **Settings** > **Environment Variables** を開く
4. 以下の環境変数を追加：

### 必須の環境変数

```
NEXT_PUBLIC_SUPABASE_URL=https://uohoxlpglyjzaxrpmlsy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvaG94bHBnbHlqemF4cnBtbHN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwNTIxOTEsImV4cCI6MjA4ODYyODE5MX0.FXCw8i7RH56ev8CJ14cXVgdmm0smSkjaDFY4gw0b3nM
```

### オプション（後で設定可能）

```
NEXT_PUBLIC_APP_URL=https://your-project.vercel.app
```

**重要**: `NEXT_PUBLIC_APP_URL` は、デプロイ後に表示されるURLを使用してください。

## ステップ4: 本番環境に再デプロイ

環境変数を設定したら、再デプロイ：

```bash
vercel --prod
```

## ステップ5: デプロイURLを確認

デプロイが完了すると、以下のようなURLが表示されます：
```
Production: https://oshi-note-app-{アカウント名}.vercel.app
```

このURLをメモしてください！

## ステップ6: Stripe Webhook設定

1. [Stripe Dashboard](https://dashboard.stripe.com) にログイン
2. **Developers** > **Webhooks** を開く
3. **Add endpoint** をクリック
4. **Endpoint URL** に以下を入力：
   ```
   https://your-project-url.vercel.app/api/stripe/webhook
   ```
   （ステップ5で取得したURLを使用）
5. **Events to send** で以下を選択：
   - `checkout.session.completed`
   - `customer.subscription.deleted`
6. **Add endpoint** をクリック
7. **Signing secret** をコピー（`whsec_` で始まる文字列）
8. Vercelダッシュボードで環境変数に追加：
   ```
   STRIPE_WEBHOOK_SECRET=whsec_xxxxx
   ```
9. 再デプロイ: `vercel --prod`

## 完了！

これで本番環境のURLが取得でき、Stripe Webhookも設定できます！
