# 私だけの推しノート

あなただけの推しノートを作成・管理するWebアプリケーションです。

## 技術スタック

- **フロントエンド**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **バックエンド**: Next.js API Routes (Node.js)
- **データベース**: Supabase (PostgreSQL)
- **認証**: Supabase Auth (メール + Google OAuth)
- **AI**: Anthropic Claude API (記事生成)
- **決済**: Stripe
- **デプロイ**: Vercel

## セットアップ手順

### 1. リポジトリのクローンと依存関係のインストール

```bash
# 依存関係をインストール
npm install
```

### 2. 環境変数の設定

`env.example` をコピーして `.env.local` を作成し、必要な環境変数を設定してください。

```bash
cp env.example .env.local
```

`.env.local` ファイルを編集し、以下の値を設定します：

#### Supabase設定

1. [Supabase](https://app.supabase.com) でプロジェクトを作成
2. Settings > API から以下を取得：
   - `NEXT_PUBLIC_SUPABASE_URL`: プロジェクトのURL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Anon (public) key
3. **データベーススキーマの作成**:
   - Supabase Dashboardの「SQL Editor」を開く
   - `supabase/migrations/20240309_initial_schema.sql` の内容をコピーして実行
   - または、`supabase/README.md` を参照して詳細な手順を確認

#### Stripe設定

1. [Stripeダッシュボード](https://dashboard.stripe.com) にログイン
2. Developers > API keys から以下を取得：
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: Publishable key
   - `STRIPE_SECRET_KEY`: Secret key

#### Anthropic Claude API設定

1. [Anthropic Console](https://console.anthropic.com) でAPIキーを取得
2. `ANTHROPIC_API_KEY` に設定

#### 情報収集バッチ処理用APIキー

1. **Twitter API v2**: https://developer.twitter.com/en/portal/dashboard でBearer Tokenを取得
   - `TWITTER_BEARER_TOKEN` に設定

2. **YouTube Data API v3**: https://console.cloud.google.com/apis/credentials でAPIキーを取得
   - `YOUTUBE_API_KEY` に設定

3. **Vercel Cron認証**: ランダムな文字列を生成（例: `openssl rand -hex 32`）
   - `CRON_SECRET` に設定

詳細は `lib/collectors/README.md` を参照してください。

#### Stripeサブスクリプション設定

1. **Stripeダッシュボード**: https://dashboard.stripe.com で以下を設定
   - 商品と価格を作成（¥650/月）
   - Webhookエンドポイントを追加
   - `STRIPE_PRICE_ID`: 作成したPrice ID
   - `STRIPE_WEBHOOK_SECRET`: WebhookのSigning secret

詳細は `lib/stripe/README.md` を参照してください。

### 3. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いてアプリケーションを確認できます。

## プロジェクト構成

```
oshi-note/
├── app/                      # Next.js App Router
│   ├── (auth)/              # 認証関連ページ（ログイン・サインアップ）
│   │   ├── login/          # ログインページ
│   │   └── signup/         # サインアップページ
│   ├── (dashboard)/        # ログイン後のメイン画面
│   │   └── page.tsx        # ダッシュボードトップページ
│   ├── layout.tsx          # ルートレイアウト
│   └── page.tsx            # トップページ
├── components/
│   ├── ui/                 # 共通UIコンポーネント
│   │   ├── button.tsx     # ボタンコンポーネント
│   │   ├── input.tsx      # 入力フィールドコンポーネント
│   │   ├── card.tsx       # カードコンポーネント
│   │   └── index.ts       # エクスポート
│   └── features/          # 機能別コンポーネント
│       └── (今後実装予定)
├── lib/                    # ライブラリ・ユーティリティ
│   ├── supabase/          # Supabaseクライアント
│   │   ├── client.ts      # ブラウザ用クライアント
│   │   ├── server.ts      # サーバー用クライアント
│   │   └── middleware.ts  # ミドルウェア用クライアント
│   ├── stripe/            # Stripeクライアント
│   │   ├── client.ts      # ブラウザ用クライアント
│   │   └── server.ts      # サーバー用クライアント
│   ├── claude/            # Anthropic Claude APIクライアント
│   │   └── client.ts      # Claude APIクライアント
│   └── collectors/        # 情報収集バッチ処理
│       ├── twitter.ts     # Twitterコレクター
│       ├── youtube.ts     # YouTubeコレクター
│       ├── website.ts     # Websiteコレクター
│       ├── index.ts       # オーケストレーター
│       └── README.md      # 詳細ドキュメント
│   └── ai/                 # AI記事生成
│       ├── prompts.ts     # プロンプトテンプレート
│       └── articleGenerator.ts  # 記事生成ロジック
├── types/                  # TypeScript型定義
│   ├── database.ts        # Supabaseデータベース型定義
│   └── index.ts           # アプリケーション型定義
├── supabase/              # Supabase設定
│   ├── migrations/        # データベースマイグレーション
│   │   ├── 20240309_initial_schema.sql
│   │   └── 20240309_storage_setup.sql
│   └── README.md         # Supabase設定手順
├── vercel.json            # Vercel設定（Cron Jobs含む）
│   - 情報収集: 毎朝6時 (/api/cron/collect)
│   - 記事生成: 毎朝7時 (/api/cron/generate)
├── app/api/stripe/        # Stripe API
│   ├── checkout/          # Checkoutセッション作成
│   └── webhook/           # Webhook受信
├── public/                 # 静的ファイル
├── env.example            # 環境変数のサンプル
└── README.md             # このファイル
```

## 各ディレクトリの役割

### `app/`
Next.js App Routerを使用したページとレイアウトを配置します。
- `(auth)/`: 認証関連のページ（Route Groups）
- `(dashboard)/`: ログイン後のメイン画面（Route Groups）

### `components/ui/`
アプリ全体で使用する共通UIコンポーネントを配置します。
- 再利用可能なボタン、入力フィールド、カードなどのコンポーネント

### `components/features/`
機能ごとのコンポーネントを配置します。
- ノート一覧、ノートエディタ、サブスクリプション管理など

### `lib/`
外部サービス（Supabase、Stripe、Claude）のクライアント初期化コードを配置します。
- ブラウザ用とサーバー用で分離
- 環境変数を使用した設定

### `types/`
TypeScriptの型定義を配置します。
- Supabaseのデータベース型
- アプリケーション全体で使用する型

## 開発

### ビルド

```bash
npm run build
```

### 本番環境での起動

```bash
npm start
```

### リント

```bash
npm run lint
```

## デプロイ

### Vercelへのデプロイ

1. [Vercel](https://vercel.com) にログイン
2. 新しいプロジェクトを作成
3. GitHubリポジトリを接続
4. 環境変数を設定（VercelダッシュボードのSettings > Environment Variables）
5. デプロイ

Vercelは自動的にNext.jsアプリケーションを検出し、最適な設定でデプロイします。

## ライセンス

このプロジェクトはMITライセンスの下で公開されています。
