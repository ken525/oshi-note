# デプロイ手順（今すぐ実行）

## 現在の状況
- ✅ 新しいVercelアカウントでログイン済み
- ✅ .vercelディレクトリを削除済み
- ⏳ デプロイの確認待ち

## 次のステップ

### 1. デプロイを実行

ターミナルで以下を実行：

```bash
vercel --yes
```

または、対話形式で進める場合：

```bash
vercel
```

質問に答える：
- **Set up and deploy?** → `yes`
- **Which scope?** → 新しいアカウントを選択
- **Link to existing project?** → `no`
- **What's your project's name?** → `oshi-note-app`（または任意の名前）
- **In which directory is your code located?** → `./`
- **Want to modify these settings?** → `no`

### 2. デプロイ完了後

デプロイが完了すると、以下のようなURLが表示されます：
```
Production: https://oshi-note-app-{アカウント名}.vercel.app
```

このURLをメモしてください！

### 3. 環境変数を設定

1. [Vercel Dashboard](https://vercel.com/dashboard) にアクセス
2. プロジェクトを選択
3. **Settings** > **Environment Variables** を開く
4. 以下を追加：

```
NEXT_PUBLIC_SUPABASE_URL=https://uohoxlpglyjzaxrpmlsy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvaG94bHBnbHlqemF4cnBtbHN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwNTIxOTEsImV4cCI6MjA4ODYyODE5MX0.FXCw8i7RH56ev8CJ14cXVgdmm0smSkjaDFY4gw0b3nM
```

### 4. 本番環境に再デプロイ

```bash
vercel --prod
```

### 5. Stripe Webhook設定

デプロイURLを取得したら、Stripe Webhookを設定：
- Endpoint URL: `https://your-project-url.vercel.app/api/stripe/webhook`
