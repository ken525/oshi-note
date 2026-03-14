/**
 * Stripe Webhookエンドポイント
 * Stripeからのイベントを受信して処理
 * 
 * 署名検証:
 * - Webhook署名を検証して、Stripeからのリクエストであることを確認
 * - 本番環境では必須（セキュリティのため）
 * 
 * 処理するイベント:
 * - checkout.session.completed: 支払い完了時にprofilesテーブルのplanを'standard'に更新
 * - customer.subscription.deleted: サブスクリプション解約時にplanを'free'に戻す
 * 
 * Stripe Webhook設定手順:
 * 1. Stripeダッシュボード > Developers > Webhooks
 * 2. Add endpoint をクリック
 * 3. Endpoint URL: https://your-domain.com/api/stripe/webhook
 * 4. Events to send で以下を選択:
 *    - checkout.session.completed
 *    - customer.subscription.deleted
 * 5. Add endpoint をクリック
 * 6. Signing secret をコピー（whsec_で始まる文字列）
 * 7. 環境変数STRIPE_WEBHOOK_SECRETに設定
 * 
 * ローカルテスト:
 * Stripe CLIを使用してローカルでWebhookをテストできます:
 * stripe listen --forward-to localhost:3000/api/stripe/webhook
 */
import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { stripe } from '@/lib/stripe/server'
import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

// Edge runtimeはStripe Webhookでは使用しない（body.text()が使えないため）
// export const runtime = 'edge'

export async function POST(request: Request) {
  try {
    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripeが設定されていません' },
        { status: 500 }
      )
    }

    const body = await request.text()
    const headersList = await headers()
    const signature = headersList.get('stripe-signature')

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      )
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
    if (!webhookSecret) {
      console.error('STRIPE_WEBHOOK_SECRET is not set')
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      )
    }

    let event: Stripe.Event

    try {
      // Webhook署名を検証
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        webhookSecret
      )
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message)
      return NextResponse.json(
        { error: `Webhook Error: ${err.message}` },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // イベントタイプに応じて処理
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        // メタデータからユーザーIDを取得
        const userId = session.metadata?.userId || (session as any).subscription_details?.metadata?.userId

        if (!userId) {
          console.error('User ID not found in session metadata')
          break
        }

        // サブスクリプションIDを取得
        const subscriptionId = typeof session.subscription === 'string'
          ? session.subscription
          : session.subscription?.id

        if (!subscriptionId) {
          console.error('Subscription ID not found')
          break
        }

        // profilesテーブルのplanを'standard'に更新
        // @ts-ignore - Supabase型定義の問題を回避
        const { error: updateError } = await (supabase
          .from('profiles')
          // @ts-ignore
          .update({ plan: 'standard' })
          .eq('id', userId) as any)

        if (updateError) {
          console.error('Error updating profile plan:', updateError)
        } else {
          console.log(`Plan updated to standard for user ${userId}`)
        }

        // 将来的にはsubscriptionsテーブルに保存することも可能
        // 現時点ではprofilesテーブルのplanカラムで管理

        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription

        // メタデータからユーザーIDを取得
        const userId = subscription.metadata?.userId

        if (!userId) {
          console.error('User ID not found in subscription metadata')
          break
        }

        // profilesテーブルのplanを'free'に戻す
        // @ts-ignore - Supabase型定義の問題を回避
        const { error: updateError } = await (supabase
          .from('profiles')
          // @ts-ignore
          .update({ plan: 'free' })
          .eq('id', userId) as any)

        if (updateError) {
          console.error('Error updating profile plan:', updateError)
        } else {
          console.log(`Plan updated to free for user ${userId}`)
        }

        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: error.message || 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
