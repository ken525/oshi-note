/**
 * サブスクリプション関連のユーティリティ関数
 * プラン取得・制限チェック機能
 */
import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@/types'

export type Plan = 'free' | 'standard'

export interface PlanLimits {
  maxOshi: number
  archiveDays: number // 直近何日分のアーカイブにアクセス可能か（-1は無制限）
  hasAds: boolean
}

/**
 * プランの制限を取得
 */
export function getPlanLimits(plan: Plan): PlanLimits {
  switch (plan) {
    case 'standard':
      return {
        maxOshi: -1, // 無制限
        archiveDays: -1, // 無制限
        hasAds: false,
      }
    case 'free':
    default:
      return {
        maxOshi: 1,
        archiveDays: 3, // 直近3日分
        hasAds: true,
      }
  }
}

/**
 * ユーザーのプランを取得
 */
export async function getUserPlan(userId: string): Promise<Plan> {
  const supabase = await createClient()
  
  // @ts-ignore - Supabase型定義の問題を回避
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', userId)
    .single()

  if (error || !profile) {
    return 'free' // デフォルトは無料プラン
  }

  return (profile as any).plan || 'free'
}

/**
 * 推し登録上限チェック
 * @returns true: 登録可能, false: 上限に達している
 */
export async function checkOshiLimit(userId: string): Promise<{
  canAdd: boolean
  currentCount: number
  maxCount: number
  plan: Plan
}> {
  const plan = await getUserPlan(userId)
  const limits = getPlanLimits(plan)

  // 無制限の場合は常にtrue
  if (limits.maxOshi === -1) {
    return {
      canAdd: true,
      currentCount: 0,
      maxCount: -1,
      plan,
    }
  }

  const supabase = await createClient()
  
  // @ts-ignore - Supabase型定義の問題を回避
  const { count, error } = await supabase
    .from('oshi')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  if (error) {
    console.error('Error checking oshi limit:', error)
    return {
      canAdd: false,
      currentCount: 0,
      maxCount: limits.maxOshi,
      plan,
    }
  }

  const currentCount = count || 0
  const canAdd = currentCount < limits.maxOshi

  return {
    canAdd,
    currentCount,
    maxCount: limits.maxOshi,
    plan,
  }
}

/**
 * アーカイブアクセス権チェック
 * @param userId ユーザーID
 * @param date アクセスしようとしている日付
 * @returns true: アクセス可能, false: アクセス不可
 */
export async function checkArchiveAccess(
  userId: string,
  date: Date
): Promise<{
  canAccess: boolean
  plan: Plan
  reason?: string
}> {
  const plan = await getUserPlan(userId)
  const limits = getPlanLimits(plan)

  // 無制限の場合は常にtrue
  if (limits.archiveDays === -1) {
    return {
      canAccess: true,
      plan,
    }
  }

  // 直近N日分のチェック
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const targetDate = new Date(date)
  targetDate.setHours(0, 0, 0, 0)

  const diffTime = today.getTime() - targetDate.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

  const canAccess = diffDays <= limits.archiveDays

  return {
    canAccess,
    plan,
    reason: canAccess
      ? undefined
      : `無料プランでは直近${limits.archiveDays}日分のアーカイブのみ閲覧可能です`,
  }
}

/**
 * 広告表示が必要かチェック
 */
export async function shouldShowAds(userId: string): Promise<boolean> {
  const plan = await getUserPlan(userId)
  const limits = getPlanLimits(plan)
  return limits.hasAds
}
