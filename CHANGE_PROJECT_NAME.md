# プロジェクト名の変更方法

## 方法1: Vercelダッシュボードで変更（推奨）

1. [Vercel Dashboard](https://vercel.com/dashboard) にアクセス
2. `oshi-note` プロジェクトを選択
3. **Settings** > **General** を開く
4. **Project Name** を変更：
   - 現在: `oshi-note`
   - 変更後: `oshinote` または `oshi-note-app`（本名を含まない名前）
5. **Save** をクリック

これでURLが変わります：
- 変更前: `https://oshi-note-xxx-kenji-maeokas-projects-16ecad34.vercel.app`
- 変更後: `https://oshinote-xxx-{アカウント名}.vercel.app`

## 方法2: カスタムドメインを設定

1. Vercelダッシュボード > Settings > Domains
2. ドメインを追加（例: `oshinote.com`）
3. DNS設定を更新

## 方法3: プロジェクトを削除して再作成

1. 現在のプロジェクトを削除
2. `.vercel` フォルダを削除
3. 新しいプロジェクト名で再デプロイ

## 注意

プロジェクト名を変更すると、URLが変わります。
Stripe Webhookの設定も新しいURLに更新する必要があります。
