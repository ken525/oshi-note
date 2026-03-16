/**
 * Supabaseデータベースの型定義
 * Supabaseの型生成コマンドで自動生成される型をここに配置
 * 例: `npx supabase gen types typescript --project-id <project-id> > types/database.ts`
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          nickname: string | null
          avatar_url: string | null
          plan: 'free' | 'standard'
          last_active_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          nickname?: string | null
          avatar_url?: string | null
          plan?: 'free' | 'standard'
          last_active_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nickname?: string | null
          avatar_url?: string | null
          plan?: 'free' | 'standard'
          last_active_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      oshi: {
        Row: {
          id: string
          user_id: string
          name: string
          group_name: string | null
          keywords: string[]
          icon_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          group_name?: string | null
          keywords?: string[]
          icon_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          group_name?: string | null
          keywords?: string[]
          icon_url?: string | null
          created_at?: string
        }
      }
      articles: {
        Row: {
          id: string
          user_id: string
          oshi_id: string
          title: string
          content: string
          highlights: Json
          source_links: Json
          published_date: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          oshi_id: string
          title: string
          content: string
          highlights?: Json
          source_links?: Json
          published_date?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          oshi_id?: string
          title?: string
          content?: string
          highlights?: Json
          source_links?: Json
          published_date?: string | null
          created_at?: string
        }
      }
      raw_posts: {
        Row: {
          id: string
          oshi_id: string
          source: 'twitter' | 'instagram' | 'tiktok' | 'youtube' | 'website'
          original_url: string
          content: string
          posted_at: string | null
          collected_at: string
        }
        Insert: {
          id?: string
          oshi_id: string
          source: 'twitter' | 'instagram' | 'tiktok' | 'youtube' | 'website'
          original_url: string
          content: string
          posted_at?: string | null
          collected_at?: string
        }
        Update: {
          id?: string
          oshi_id?: string
          source?: 'twitter' | 'instagram' | 'tiktok' | 'youtube' | 'website'
          original_url?: string
          content?: string
          posted_at?: string | null
          collected_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
