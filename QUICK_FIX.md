# クイック修正ガイド

## 1. プロジェクト名の変更

プロジェクト名を変更すると、URLから本名が消えます：

```bash
vercel project rename oshi-note oshi-note-app
```

変更後、新しいURLは：
`https://oshi-note-app-kenji-maeokas-projects.vercel.app`

さらに短くしたい場合：
```bash
vercel project rename oshi-note-app oshinote
```

## 2. ビルドエラーの一時的な回避

型エラーがある場合、一時的に型チェックをスキップ：

### package.jsonを編集

```json
"build": "next build --no-lint"
```

または、環境変数でスキップ：

Vercelダッシュボード > Settings > Environment Variables に追加：
- `SKIP_TYPE_CHECK` = `true`

## 3. 環境変数の設定

Vercelダッシュボードで以下を設定：

```
NEXT_PUBLIC_SUPABASE_URL=https://uohoxlpglyjzaxrpmlsy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvaG94bHBnbHlqemF4cnBtbHN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwNTIxOTEsImV4cCI6MjA4ODYyODE5MX0.FXCw8i7RH56ev8CJ14cXVgdmm0smSkjaDFY4gw0b3nM
```

## 4. 再デプロイ

```bash
vercel --prod
```

## 5. デプロイ後のURLをStripe Webhookに設定

デプロイが成功したら、表示されたURLをStripe Webhook設定で使用：
`https://your-project-name.vercel.app/api/stripe/webhook`
