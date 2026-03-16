/**
 * テスト用: ダミーデータで記事生成をテストするAPI
 * - API（JSON）: http://localhost:3000/api/test/generate-article
 * - 記事UIでプレビュー: http://localhost:3000/test/generate-article
 */
import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { ArticleGenerator } from "@/lib/ai/articleGenerator"
import type { CollectedPost } from "@/types/collector"
import type { Oshi, RawPost } from "@/types"

export async function POST() {
  try {
    const supabase = await createClient()
    
    // 現在のユーザーを取得（テストAPIは認証必須）
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Auth session missing!' },
        { status: 401 }
      )
    }

    // 認証済み: ユーザーの推しを検索
    const { data: oshiList, error: oshiError } = await supabase
      .from("oshi")
      .select("*")
      .eq("user_id", user.id)
      .ilike("name", "%空詩かれん%")

    if (oshiError) {
      throw oshiError
    }

    if (!oshiList || oshiList.length === 0) {
      // 推しが見つからない場合、ダミーの推しデータを作成
      const dummyOshi = {
        id: 'test-oshi-id',
        user_id: user.id,
        name: '空詩かれん',
        group_name: 'iLIFE',
        keywords: ['空詩かれん', 'かれん'],
        icon_url: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as Oshi

      // ダミーデータで記事生成
      const dummyPosts: RawPost[] = [
        {
          id: 'test-1',
          oshi_id: dummyOshi.id,
          source: 'twitter',
          original_url: 'https://x.com/example/status/123',
          content: 'みんないつもありがとう🥹 ライブ楽しみにしてて！',
          posted_at: '2026-03-15T10:30:00Z',
          collected_at: new Date().toISOString(),
          metadata: {
            likes: 3200,
            retweets: 891,
            favorite_count: 3200,
            retweet_count: 891,
          },
        } as RawPost,
        {
          id: 'test-2',
          oshi_id: dummyOshi.id,
          source: 'tiktok',
          original_url: 'https://tiktok.com/@example/video/456',
          content: '新曲の振り付け練習してみた🎵',
          posted_at: '2026-03-15T15:00:00Z',
          collected_at: new Date().toISOString(),
          metadata: {
            likes: 8500,
            views: 45000,
            comments: 320,
          },
        } as RawPost,
        {
          id: 'test-3',
          oshi_id: dummyOshi.id,
          source: 'website',
          original_url: 'https://example.com/news/123',
          content: '4月ワンマンライブ追加公演決定のお知らせ',
          posted_at: '2026-03-15T09:00:00Z',
          collected_at: new Date().toISOString(),
          metadata: {},
        } as RawPost,
      ]

      const generator = new ArticleGenerator()
      const generationResult = await generator.generate(dummyOshi, dummyPosts)

      if (!generationResult.success || !generationResult.article) {
        return NextResponse.json(
          {
            success: false,
            error: generationResult.error || "記事の生成に失敗しました",
          },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: "記事を生成しました（ダミーデータ使用）",
        article: generationResult.article,
        oshi_name: dummyOshi.name,
        note: "推しが見つからなかったため、ダミーデータでテストしました",
      })
    }

    const oshi = oshiList[0]

    // ダミーデータを作成
    const dummyPosts: RawPost[] = [
      {
        id: 'test-1',
        oshi_id: oshi.id,
        source: 'twitter',
        original_url: 'https://x.com/example/status/123',
        content: 'みんないつもありがとう🥹 ライブ楽しみにしてて！',
        posted_at: '2026-03-15T10:30:00Z',
        collected_at: new Date().toISOString(),
        metadata: {
          likes: 3200,
          retweets: 891,
          favorite_count: 3200,
          retweet_count: 891,
        },
      } as RawPost,
      {
        id: 'test-2',
        oshi_id: oshi.id,
        source: 'tiktok',
        original_url: 'https://tiktok.com/@example/video/456',
        content: '新曲の振り付け練習してみた🎵',
        posted_at: '2026-03-15T15:00:00Z',
        collected_at: new Date().toISOString(),
        metadata: {
          likes: 8500,
          views: 45000,
          comments: 320,
        },
      } as RawPost,
      {
        id: 'test-3',
        oshi_id: oshi.id,
        source: 'website',
        original_url: 'https://example.com/news/123',
        content: '4月ワンマンライブ追加公演決定のお知らせ',
        posted_at: '2026-03-15T09:00:00Z',
        collected_at: new Date().toISOString(),
        metadata: {},
      } as RawPost,
    ]

    // 記事を生成
    const generator = new ArticleGenerator()
    const generationResult = await generator.generate(oshi as Oshi, dummyPosts)

    if (!generationResult.success || !generationResult.article) {
      return NextResponse.json(
        {
          success: false,
          error: generationResult.error || "記事の生成に失敗しました",
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "記事を生成しました",
      article: generationResult.article,
      oshi_name: oshi.name,
    })
  } catch (error: any) {
    console.error("Error generating test article:", error)
    return NextResponse.json(
      { error: error.message || "記事の生成に失敗しました" },
      { status: 500 }
    )
  }
}

// GETリクエストでも実行できるようにする（テスト用）
export async function GET() {
  return POST()
}
