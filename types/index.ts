/**
 * アプリケーション全体で使用する型定義
 */

import type { Database } from './database'

// Supabaseのテーブル型をエクスポート
export type Profile = Database['public']['Tables']['profiles']['Row']
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

export type Oshi = Database['public']['Tables']['oshi']['Row']
export type OshiInsert = Database['public']['Tables']['oshi']['Insert']
export type OshiUpdate = Database['public']['Tables']['oshi']['Update']

export type Article = Database['public']['Tables']['articles']['Row']
export type ArticleInsert = Database['public']['Tables']['articles']['Insert']
export type ArticleUpdate = Database['public']['Tables']['articles']['Update']

export type RawPost = Database['public']['Tables']['raw_posts']['Row']
export type RawPostInsert = Database['public']['Tables']['raw_posts']['Insert']
export type RawPostUpdate = Database['public']['Tables']['raw_posts']['Update']

// ユーザープロフィール型（Profile + 認証情報）
export interface UserProfile extends Profile {
  email?: string
}

// 推しノート型（Articleのエイリアス、後方互換性のため）
export type Note = Article

// サブスクリプション型（Stripe連携用）
export interface Subscription {
  id: string
  user_id: string
  status: 'active' | 'canceled' | 'past_due'
  plan: 'free' | 'standard'
  current_period_end: string
  stripe_subscription_id?: string
}

// APIレスポンス型
export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}

// ハイライト情報の型
export interface ArticleHighlight {
  text: string
  start: number
  end: number
  type?: 'important' | 'quote' | 'fact'
}

// ソースリンクの型
export interface SourceLink {
  url: string
  title?: string
  source: 'twitter' | 'instagram' | 'tiktok' | 'youtube' | 'website'
  posted_at?: string
}
