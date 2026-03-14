/**
 * サブスクリプション関連のクライアントサイド関数
 * ブラウザ側で使用する関数
 */
"use client"

import { createClient } from '@/lib/supabase/client'
import type { Plan } from './subscription'

/**
 * ユーザーのプランを取得（クライアントサイド）
 */
export async function getUserPlanClient(): Promise<Plan> {
  const supabase = createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return 'free'
  }

  // @ts-ignore - Supabase型定義の問題を回避
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', user.id)
    .single()

  if (error || !profile) {
    return 'free'
  }

  return (profile as any).plan || 'free'
}

/**
 * 推し登録上限チェック（クライアントサイド）
 */
export async function checkOshiLimitClient(): Promise<{
  canAdd: boolean
  currentCount: number
  maxCount: number
  plan: Plan
}> {
  const supabase = createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      canAdd: false,
      currentCount: 0,
      maxCount: 1,
      plan: 'free',
    }
  }

  // プランを取得
  // @ts-ignore - Supabase型定義の問題を回避
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', user.id)
    .single()

  const plan = (profile as any)?.plan || 'free'

  // 無制限の場合は常にtrue
  if (plan === 'standard') {
    return {
      canAdd: true,
      currentCount: 0,
      maxCount: -1,
      plan,
    }
  }

  // @ts-ignore - Supabase型定義の問題を回避
  const { count, error } = await supabase
    .from('oshi')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  if (error) {
    return {
      canAdd: false,
      currentCount: 0,
      maxCount: 1,
      plan,
    }
  }

  const currentCount = count || 0
  const canAdd = currentCount < 1

  return {
    canAdd,
    currentCount,
    maxCount: 1,
    plan,
  }
}

/**
 * アーカイブアクセス権チェック（クライアントサイド）
 */
export async function checkArchiveAccessClient(
  date: Date
): Promise<{
  canAccess: boolean
  plan: Plan
  reason?: string
}> {
  const supabase = createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      canAccess: false,
      plan: 'free',
      reason: 'ログインが必要です',
    }
  }

  // プランを取得
  // @ts-ignore - Supabase型定義の問題を回避
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', user.id)
    .single()

  const plan = (profile as any)?.plan || 'free'

  // スタンダードプランは無制限
  if (plan === 'standard') {
    return {
      canAccess: true,
      plan,
    }
  }

  // 無料プランは直近3日分のみ
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const targetDate = new Date(date)
  targetDate.setHours(0, 0, 0, 0)

  const diffTime = today.getTime() - targetDate.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

  const canAccess = diffDays <= 3

  return {
    canAccess,
    plan,
    reason: canAccess
      ? undefined
      : '無料プランでは直近3日分のアーカイブのみ閲覧可能です',
  }
}
