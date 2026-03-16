/**
 * 推しCRUD APIエンドポイント
 * 注意: 実際の実装では、クライアント側から直接Supabaseにアクセスする方が効率的です
 * このAPIはサーバーサイドでの処理が必要な場合に使用します
 */
import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { after } from "next/server"
import { generateInitialArticles } from "@/lib/ai/articleGenerator"

// after() で記事生成を行うため長めのタイムアウトを設定
export const maxDuration = 60

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 })
    }

    const { data, error } = await supabase
      .from("oshi")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) throw error

    return NextResponse.json({ data })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "エラーが発生しました" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 })
    }

    // プラン制限チェック
    const { data: profile } = await supabase
      .from("profiles")
      .select("plan")
      .eq("id", user.id)
      .single()

    if (profile && (profile as any).plan === "free") {
      const { count } = await supabase
        .from("oshi")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)

      if (count && count >= 1) {
        return NextResponse.json(
          { error: "無料プランでは1名まで登録できます" },
          { status: 403 }
        )
      }
    }

    const body = await request.json()
    const { data, error } = await supabase
      .from("oshi")
      .insert({
        ...body,
        user_id: user.id,
      })
      .select()
      .single()

    if (error) throw error

    const oshiId = (data as any)?.id
    if (oshiId) {
      // after() を使い、レスポンス送信後もVercel関数を生かして生成を実行
      after(async () => {
        try {
          await generateInitialArticles(oshiId)
        } catch (err) {
          console.error("[api/oshi] generateInitialArticles failed:", err)
        }
      })
    }

    return NextResponse.json({ data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "エラーが発生しました" },
      { status: 500 }
    )
  }
}
