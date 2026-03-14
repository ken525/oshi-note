/**
 * Stripeクライアント（サーバー用）
 * サーバーサイド（API Routes）でStripe APIを呼び出す際に使用
 */
import Stripe from 'stripe'

// 環境変数が設定されている場合のみStripeクライアントを初期化
export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2026-02-25.clover',
      typescript: true,
    })
  : null
