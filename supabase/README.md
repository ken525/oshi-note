# Supabase データベース設定

このディレクトリには、Supabaseデータベースのマイグレーションファイルが含まれています。

## マイグレーションの実行方法

### 方法1: Supabase Dashboard（推奨）

1. [Supabase Dashboard](https://app.supabase.com) にログイン
2. プロジェクトを選択
3. 左メニューから「SQL Editor」を選択
4. `supabase/migrations/20240309_initial_schema.sql` の内容をコピー
5. SQL Editorに貼り付けて実行

### 方法2: Supabase CLI

```bash
# Supabase CLIをインストール（未インストールの場合）
npm install -g supabase

# Supabaseにログイン
supabase login

# プロジェクトをリンク
supabase link --project-ref your-project-ref

# マイグレーションを実行
supabase db push
```

### 方法3: 手動実行

1. Supabase Dashboardの「SQL Editor」を開く
2. 各マイグレーションファイルの内容を順番に実行

## テーブル構造

### profiles（ユーザープロフィール）
- `id`: UUID (auth.users参照)
- `nickname`: ニックネーム
- `avatar_url`: アバター画像URL
- `plan`: プラン ('free' | 'standard')
- `created_at`, `updated_at`: タイムスタンプ

### oshi（推し登録）
- `id`: UUID
- `user_id`: ユーザーID (profiles参照)
- `name`: 推しの名前
- `group_name`: グループ名（任意）
- `keywords`: 検索キーワード配列
- `icon_url`: アイコン画像URL
- `created_at`: 作成日時

### articles（生成された推しノート記事）
- `id`: UUID
- `user_id`: ユーザーID
- `oshi_id`: 推しID (oshi参照)
- `title`: 記事タイトル
- `content`: 記事内容（Markdown形式）
- `highlights`: ハイライト情報（JSONB）
- `source_links`: 情報ソースURLリスト（JSONB）
- `published_date`: 公開日
- `created_at`: 作成日時

### raw_posts（収集した生データ）
- `id`: UUID
- `oshi_id`: 推しID (oshi参照)
- `source`: ソース ('twitter' | 'instagram' | 'tiktok' | 'youtube' | 'website')
- `original_url`: 元のURL
- `content`: コンテンツ
- `posted_at`: 投稿日時
- `collected_at`: 収集日時

## Row Level Security (RLS)

すべてのテーブルでRLSが有効化されており、以下のポリシーが設定されています：

- **profiles**: ユーザーは自分のプロフィールのみ閲覧・更新可能
- **oshi**: ユーザーは自分の推しのみ操作可能
- **articles**: ユーザーは自分の記事のみ操作可能
- **raw_posts**: ユーザーは自分の推しに関連するraw_postsのみ操作可能

## インデックス

以下のインデックスが設定されています：

- `profiles.plan`: プラン検索用
- `oshi.user_id`: ユーザー別推し検索用
- `oshi.created_at`: 作成日時順ソート用
- `articles.user_id`: ユーザー別記事検索用
- `articles.oshi_id`: 推し別記事検索用
- `articles.published_date`: 公開日順ソート用
- `articles.created_at`: 作成日時順ソート用
- `raw_posts.oshi_id`: 推し別raw_posts検索用
- `raw_posts.source`: ソース別検索用
- `raw_posts.posted_at`: 投稿日時順ソート用
- `raw_posts.collected_at`: 収集日時順ソート用
- `raw_posts.original_url`: URL重複チェック用

## 自動機能

### プロフィール自動作成
新規ユーザー登録時に、`handle_new_user()` 関数が自動的に `profiles` テーブルにレコードを作成します。

### updated_at自動更新
`profiles` テーブルの `updated_at` は、レコード更新時に自動的に更新されます。
