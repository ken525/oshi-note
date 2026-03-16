/**
 * テスト用: 「空詩かれん」の記事を1つ作成するAPI
 * ブラウザから実行: http://localhost:3000/api/test/create-article
 */
import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    const supabase = await createClient()
    
    // 現在のユーザーを取得
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 })
    }

    // 「空詩かれん」という推しを検索
    const { data: oshiList, error: oshiError } = await supabase
      .from("oshi")
      .select("*")
      .eq("user_id", user.id)
      .ilike("name", "%空詩かれん%")

    if (oshiError) {
      throw oshiError
    }

    if (!oshiList || oshiList.length === 0) {
      return NextResponse.json(
        { error: "「空詩かれん」という推しが見つかりませんでした" },
        { status: 404 }
      )
    }

    const oshi = oshiList[0]

    // テスト記事データを作成
    const today = new Date().toISOString().split("T")[0]
    const testArticle = {
      user_id: user.id,
      oshi_id: oshi.id,
      title: "空詩かれんの素敵な1日 ✨",
      content: `# 今日の空詩かれん

空詩かれんちゃん、今日も素敵な1日を過ごしていました！

## 今日のハイライト

空詩かれんちゃんは、今日もファンの皆さんに素敵な笑顔を見せてくれました。いつも通り、明るく元気な姿が印象的でした。

## ファンとしての感想

空詩かれんちゃんの成長を毎日見守ることができて、本当に幸せです。これからも応援していきます！`,
      highlights: [
        "空詩かれんちゃんの素敵な笑顔",
        "明るく元気な姿が印象的",
        "ファンの皆さんへの感謝の気持ち"
      ],
      source_links: [
        {
          label: "公式Twitter",
          url: "https://twitter.com/example"
        }
      ],
      published_date: today,
    }

    // 記事を挿入
    // @ts-ignore - Supabase型定義の問題を回避
    const { data: article, error: insertError } = await supabase
      .from("articles")
      .insert(testArticle as any)
      .select()
      .single()

    if (insertError) {
      throw insertError
    }

    return NextResponse.json({
      success: true,
      message: "記事を作成しました",
      article: {
        id: article?.id,
        title: article?.title,
        oshi_name: oshi.name,
      },
    })
  } catch (error: any) {
    console.error("Error creating test article:", error)
    return NextResponse.json(
      { error: error.message || "記事の作成に失敗しました" },
      { status: 500 }
    )
  }
}

// GETリクエストでも実行できるようにする（テスト用）
export async function GET() {
  return POST()
}
