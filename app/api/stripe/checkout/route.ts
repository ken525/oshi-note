/**
 * Stripe Checkout セッション作成API
 * スタンダードプランへのアップグレード処理
 * 
 * Stripeセットアップ手順:
 * 1. Stripeダッシュボード（https://dashboard.stripe.com）にログイン
 * 2. Products > Add product で商品を作成
 *    - Name: スタンダードプラン
 *    - Price: ¥650/月（Recurring）
 *    - Price IDをコピー（例: price_xxxxx）
 * 3. 環境変数STRIPE_PRICE_IDに設定
 * 4. Webhooks > Add endpoint でWebhookエンドポイントを追加
 *    - URL: https://your-domain.com/api/stripe/webhook
 *    - Events: checkout.session.completed, customer.subscription.deleted
 *    - Signing secretをコピーして環境変数STRIPE_WEBHOOK_SECRETに設定
 */
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe/server'

export async function POST(request: Request) {
  try {
    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripeが設定されていません' },
        { status: 500 }
      )
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      )
    }

    // 既にスタンダードプランかチェック
    // @ts-ignore - Supabase型定義の問題を回避
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', user.id)
      .single()

    if (profile && (profile as any).plan === 'standard') {
      return NextResponse.json(
        { error: '既にスタンダードプランです' },
        { status: 400 }
      )
    }

    const priceId = process.env.STRIPE_PRICE_ID
    if (!priceId) {
      return NextResponse.json(
        { error: 'Stripe Price IDが設定されていません' },
        { status: 500 }
      )
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    // Stripe Checkout セッションを作成
    const session = await stripe.checkout.sessions.create({
      customer_email: user.email || undefined,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/settings/plan?success=true`,
      cancel_url: `${baseUrl}/settings/plan?canceled=true`,
      metadata: {
        userId: user.id,
      },
      subscription_data: {
        metadata: {
          userId: user.id,
        },
      },
    })

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    })
  } catch (error: any) {
    console.error('Stripe Checkout error:', error)
    return NextResponse.json(
      { error: error.message || 'Checkoutセッションの作成に失敗しました' },
      { status: 500 }
    )
  }
}
