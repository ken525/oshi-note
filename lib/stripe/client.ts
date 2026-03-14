/**
 * Stripeクライアント（ブラウザ用）
 * フロントエンドでStripe Checkout等を使用する際に使用
 */
import { loadStripe } from '@stripe/stripe-js'

export const getStripe = () => {
  return loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
}
