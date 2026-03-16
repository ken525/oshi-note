/**
 * 記事オンデマンド生成APIエンドポイント
 * 推しIDを受け取り、今日〜直近3日分の記事を生成してDBに保存する
 * Vercelのサーバーレス関数タイムアウト対策として、このエンドポイントを明示的に呼び出す
 */
import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { generateArticleForDate } from "@/lib/ai/articleGenerator"

// Vercel: Hobby 最大60秒、Pro 最大300秒
export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 })
    }

    const body = await request.json()
    const { oshiId, date } = body

    if (!oshiId) {
      return NextResponse.json({ error: "oshiId が必要です" }, { status: 400 })
    }

    // 推しが自分のものか確認
    const { data: oshi, error: oshiError } = await supabase
      .from("oshi")
      .select("id")
      .eq("id", oshiId)
      .eq("user_id", user.id)
      .single()

    if (oshiError || !oshi) {
      return NextResponse.json({ error: "推しが見つかりません" }, { status: 404 })
    }

    // 既に記事が存在するか確認
    const { data: existing, count } = await supabase
      .from("articles")
      .select("id", { count: "exact", head: true })
      .eq("oshi_id", oshiId)
      .eq("user_id", user.id)

    if (count && count > 0) {
      return NextResponse.json({ message: "既に記事があります", count })
    }

    // 今日〜直近3日分の記事を生成
    const today = new Date()
    const dates = date
      ? [date]
      : [0, 1, 2].map((i) => {
          const d = new Date(today)
          d.setDate(d.getDate() - i)
          return d.toISOString().split("T")[0]
        })

    const results: { date: string; success: boolean; error?: string }[] = []

    for (const targetDate of dates) {
      try {
        await generateArticleForDate(oshiId, targetDate)
        results.push({ date: targetDate, success: true })
      } catch (err: any) {
        console.error(`[api/articles/generate] failed for ${targetDate}:`, err)
        results.push({ date: targetDate, success: false, error: err.message })
      }
    }

    const successCount = results.filter((r) => r.success).length
    return NextResponse.json({ generated: successCount, results })
  } catch (error: any) {
    console.error("[api/articles/generate] error:", error)
    return NextResponse.json(
      { error: error.message || "エラーが発生しました" },
      { status: 500 }
    )
  }
}
