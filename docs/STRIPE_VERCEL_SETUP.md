# Stripe 本番環境 × Vercel 設定ガイド

本番で課金を有効にするための、Stripe と Vercel の設定手順です。

---

## 前提

- Stripe を**本番モード**に切り替え済みであること（ダッシュボード右上の「テストモード」トグルがオフ）
- Vercel にプロジェクトがデプロイ済みで、本番 URL が決まっていること（例: `https://oshi-note-five.vercel.app`）

---

## 1. Stripe ダッシュボードでの設定

### 1-1. 本番用 API キーを確認

1. [Stripe ダッシュボード](https://dashboard.stripe.com) にログイン
2. 右上で **「テストモード」をオフ** にして本番モードにする
3. **Developers** → **API keys** を開く
4. 以下をメモ（後で Vercel に登録する）:
   - **Publishable key**（`pk_live_xxxxx`）→ `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - **Secret key**（`sk_live_xxxxx`）→ **「Reveal test key」なら「Reveal live key」** を押して表示 → `STRIPE_SECRET_KEY`

> **注意**: Secret key は絶対に公開・Git にコミットしないでください。

---

### 1-2. 本番用「商品」と「価格」を作成

1. **Product catalog** → **Products** を開く
2. **Add product** をクリック
3. 例として次のように入力:
   - **Name**: `スタンダードプラン`（任意の名前で OK）
   - **Description**: （任意）例: 推し無制限・アーカイブ全期間
4. **Pricing** で:
   - **Pricing model**: `Standard pricing`
   - **Price**: `650`（円）
   - **Billing period**: `Monthly`（月額）
   - **One time** ではなく **Recurring** になっていることを確認
5. **Save product** で保存
6. 作成した商品の **Prices** セクションで、今作った価格の **Price ID** をコピー（`price_xxxxx` 形式）→ これを `STRIPE_PRICE_ID` に使う

> テストモードで既に商品を作っている場合は、**本番モードに切り替えた状態で**同じ手順で本番用の商品・価格を新規作成してください。テスト用の `price_xxxxx` は本番では使えません。

---

### 1-3. 本番用 Webhook エンドポイントを追加

1. **Developers** → **Webhooks** を開く
2. **Add endpoint** をクリック
3. 次のように設定:
   - **Endpoint URL**:
     ```
     https://あなたの本番ドメイン/api/stripe/webhook
     ```
     例: `https://oshi-note-five.vercel.app/api/stripe/webhook`
   - **Listen to**: `Events on your account`
   - **Select events to listen to** で以下を追加:
     - `checkout.session.completed`（支払い完了時にプランを standard に更新）
     - `customer.subscription.deleted`（解約時にプランを free に戻す）
4. **Add endpoint** で保存
5. 作成したエンドポイントをクリック → **Signing secret** の **Reveal** をクリック
6. 表示された値（`whsec_xxxxx`）をコピー → これを `STRIPE_WEBHOOK_SECRET` に使う

> 本番用とテスト用でエンドポイントを分けている場合、**本番用のエンドポイント**の Signing secret を使います。テスト用の `whsec_xxxxx` は本番 Webhook では使えません。

---

## 2. Vercel での環境変数設定

1. [Vercel Dashboard](https://vercel.com/dashboard) で対象プロジェクトを開く
2. **Settings** → **Environment Variables** を開く
3. 次の変数を **Production**（必要なら Preview も）に追加する

| 名前 | 値 | 取得元 |
|------|-----|--------|
| `STRIPE_SECRET_KEY` | `sk_live_xxxxx` | Stripe: Developers → API keys → Secret key（本番） |
| `STRIPE_PRICE_ID` | `price_xxxxx` | Stripe: Products → 該当商品の Price ID（本番で作成したもの） |
| `STRIPE_WEBHOOK_SECRET` | `whsec_xxxxx` | Stripe: Developers → Webhooks → 本番エンドポイントの Signing secret |
| `NEXT_PUBLIC_APP_URL` | `https://あなたの本番ドメイン` | 例: `https://oshi-note-five.vercel.app`（末尾スラッシュなし） |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_live_xxxxx` | Stripe: Developers → API keys → Publishable key（本番） |

- **重要**: `NEXT_PUBLIC_APP_URL` は、Checkout の「支払い完了」「キャンセル」後のリダイレクト先に使います。本番 URL と一致させてください。
- 環境変数を追加・変更したあとは、**Deployments** から **Redeploy**（最新のデプロイを「Redeploy」）して反映させてください。

---

## 3. 設定の対応関係（まとめ）

```
Stripe 本番モード
├── API keys（本番）
│   ├── Publishable key → Vercel: NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
│   └── Secret key       → Vercel: STRIPE_SECRET_KEY
├── Products（本番で作成した商品の Price ID）
│   └── price_xxxxx      → Vercel: STRIPE_PRICE_ID
└── Webhooks（本番用エンドポイント 1 つ）
    ├── URL: https://あなたのドメイン/api/stripe/webhook
    ├── checkout.session.completed
    ├── customer.subscription.deleted
    └── Signing secret   → Vercel: STRIPE_WEBHOOK_SECRET

Vercel
└── NEXT_PUBLIC_APP_URL = 本番のアプリURL（リダイレクト用）
```

---

## 4. 動作確認の手順

1. **環境変数**  
   Vercel の Production に上記 5 つが入っているか確認し、入れたあと **Redeploy** する。

2. **プラン画面から課金**  
   - 本番サイトにログインする  
   - **設定** → **プラン** を開く  
   - 「このプランに変更」（スタンダードプラン）をクリック  
   - Stripe の Checkout ページ（本番）に遷移することを確認  

3. **テスト決済（本番）**  
   - Stripe の本番 Checkout では、[テストカード](https://docs.stripe.com/testing#cards) は使えません。  
   - 実際の少額（例: 1 回 650 円）で試すか、Stripe ダッシュボードの **Payments** で本番の支払いが 1 件来ているか確認する。

4. **Webhook の確認**  
   - Stripe: **Developers** → **Webhooks** → 本番用エンドポイントを開く  
   - **Recent deliveries** で、`checkout.session.completed` が 200 で成功しているか確認  
   - 失敗している場合は **Response** や Vercel の **Functions / Logs** でエラー内容を確認  

5. **プラン反映の確認**  
   - 支払い完了後、アプリの「プラン」画面を再読み込みし、**スタンダード** になっているか確認  
   - Supabase の `profiles` テーブルで、該当ユーザーの `plan` が `standard` になっているか確認してもよい  

---

## 5. よくあるトラブル

| 症状 | 確認すること |
|------|----------------|
| 「このプランに変更」を押しても何も起こらない | ブラウザのコンソールやネットワークタブで `/api/stripe/checkout` のレスポンスを確認。401/500 なら認証または環境変数。 |
| Checkout に飛ばない / エラーページになる | Vercel の `STRIPE_SECRET_KEY` と `STRIPE_PRICE_ID` が本番用か確認。Redeploy 済みか確認。 |
| 支払い完了後にプランが standard にならない | `STRIPE_WEBHOOK_SECRET` が**本番用 Webhook の** Signing secret か確認。Stripe の Webhook 一覧で該当イベントが 200 で届いているか確認。 |
| リダイレクト先が localhost になる | Vercel の `NEXT_PUBLIC_APP_URL` が本番 URL になっているか確認（`http://localhost:3000` のままになっていないか）。 |

---

## 6. 参照

- [Stripe Checkout セッション作成](https://stripe.com/docs/api/checkout/sessions/create)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- リポジトリ内: `app/api/stripe/checkout/route.ts`（Checkout）、`app/api/stripe/webhook/route.ts`（Webhook 処理）
