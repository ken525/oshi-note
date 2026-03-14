# Stripeサブスクリプション設定ガイド

## Stripeダッシュボードでの設定手順

### 1. 商品と価格の作成

1. [Stripeダッシュボード](https://dashboard.stripe.com) にログイン
2. **Products** > **Add product** をクリック
3. 以下の情報を入力:
   - **Name**: スタンダードプラン
   - **Description**: 推しノート スタンダードプラン（推し無制限・全アーカイブ・広告なし）
4. **Pricing** セクション:
   - **Pricing model**: Standard pricing
   - **Price**: ¥650
   - **Billing period**: Monthly (毎月)
   - **Recurring**: 有効
5. **Save product** をクリック
6. 作成された **Price ID** をコピー（例: `price_xxxxx`）
7. 環境変数 `STRIPE_PRICE_ID` に設定

### 2. Webhookエンドポイントの設定

1. **Developers** > **Webhooks** を開く
2. **Add endpoint** をクリック
3. **Endpoint URL** を入力:
   - 本番環境: `https://your-domain.com/api/stripe/webhook`
   - ローカルテスト: Stripe CLIを使用（後述）
4. **Events to send** で以下を選択:
   - `checkout.session.completed`
   - `customer.subscription.deleted`
5. **Add endpoint** をクリック
6. **Signing secret** をコピー（`whsec_` で始まる文字列）
7. 環境変数 `STRIPE_WEBHOOK_SECRET` に設定

### 3. ローカルでのWebhookテスト

Stripe CLIを使用してローカルでWebhookをテストできます:

```bash
# Stripe CLIをインストール（未インストールの場合）
# https://stripe.com/docs/stripe-cli

# Webhookをローカルに転送
stripe listen --forward-to localhost:3000/api/stripe/webhook

# テストイベントを送信
stripe trigger checkout.session.completed
stripe trigger customer.subscription.deleted
```

### 4. テストモードでの確認

1. Stripeダッシュボードの右上で **Test mode** を確認
2. テスト用のカード番号を使用:
   - 成功: `4242 4242 4242 4242`
   - 失敗: `4000 0000 0000 0002`
   - 有効期限: 任意の未来の日付
   - CVC: 任意の3桁

## 環境変数の設定

`.env.local` に以下を追加:

```bash
# Stripe設定
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_PRICE_ID=price_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

## 動作確認

1. プラン管理ページ (`/settings/plan`) にアクセス
2. 「このプランに変更」ボタンをクリック
3. Stripe Checkoutページでテストカード情報を入力
4. 支払い完了後、プランが「スタンダード」に更新されることを確認
5. Webhookログを確認（Stripeダッシュボード > Developers > Webhooks > イベント）

## トラブルシューティング

### Webhookが届かない
- Webhook URLが正しいか確認
- 署名検証が正しく設定されているか確認
- Stripe CLIでローカルテストを実行

### プランが更新されない
- Webhookイベントが正しく処理されているか確認
- SupabaseのRLSポリシーを確認
- サーバーログを確認

### エラーが発生する
- 環境変数が正しく設定されているか確認
- Stripe APIキーが正しいモード（テスト/本番）か確認
