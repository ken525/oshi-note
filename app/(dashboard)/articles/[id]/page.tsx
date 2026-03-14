/**
 * 記事詳細ページ
 * OGPメタタグ付き
 */
import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { ArticleDetailClient } from './ArticleDetailClient'
import { Loader2 } from 'lucide-react'
import type { Article, Oshi } from '@/types'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const { id } = await params
    const supabase = await createClient()
    
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return {
        title: '記事が見つかりません',
      }
    }

    const articleId = Array.isArray(id) ? id[0] : id

    // @ts-ignore - Supabase型定義の問題を回避
    const { data: article, error: articleError } = await supabase
      .from('articles')
      .select('*, oshi(*)')
      .eq('id', articleId)
      .eq('user_id', user.id)
      .single()

    if (articleError || !article) {
      return {
        title: '記事が見つかりません',
      }
    }

    const oshi = (article as any).oshi
    const articleData = article as any
    const highlights = Array.isArray(articleData.highlights)
      ? articleData.highlights.filter((h: any): h is string => typeof h === 'string')
      : []
    const description = highlights.length > 0
      ? highlights[0].substring(0, 150)
      : (articleData.content || '').substring(0, 150).replace(/\n/g, ' ')

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const ogImageUrl = `${baseUrl}/articles/${articleId}/opengraph-image`

    return {
      title: `${articleData.title} | 私だけの推しノート`,
      description,
      openGraph: {
        title: articleData.title,
        description,
        type: 'article',
        images: [
          {
            url: ogImageUrl,
            width: 1200,
            height: 630,
            alt: articleData.title,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title: articleData.title,
        description,
        images: [ogImageUrl],
      },
    }
  } catch (error) {
    console.error('Metadata generation error:', error)
    return {
      title: '記事が見つかりません',
    }
  }
}

export default async function ArticleDetailPage({ params }: PageProps) {
  try {
    const { id } = await params
    const supabase = await createClient()
    
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return (
        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 text-red-600 dark:text-red-400">
          ログインが必要です
        </div>
      )
    }

    const articleId = Array.isArray(id) ? id[0] : id
    if (!articleId) {
      return (
        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 text-red-600 dark:text-red-400">
          記事IDが無効です
        </div>
      )
    }

    // 記事情報を取得
    // @ts-ignore - Supabase型定義の問題を回避
    const { data: article, error: articleError } = await supabase
      .from('articles')
      .select('*, oshi(*)')
      .eq('id', articleId)
      .eq('user_id', user.id)
      .single()

    if (articleError || !article) {
      return (
        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 text-red-600 dark:text-red-400">
          記事が見つかりません
        </div>
      )
    }

    const oshi = (article as any).oshi
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const currentUrl = `${baseUrl}/articles/${articleId}`

    return (
      <ArticleDetailClient
        article={article as Article}
        oshi={oshi as Oshi | null}
        currentUrl={currentUrl}
      />
    )
  } catch (error: any) {
    return (
      <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 text-red-600 dark:text-red-400">
        {error.message || '記事の取得に失敗しました'}
      </div>
    )
  }
}
