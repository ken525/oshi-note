/**
 * OGP画像の動的生成
 * Next.js の ImageResponse を使用
 * 
 * ローカルで確認する方法:
 * 1. 開発サーバーを起動: npm run dev
 * 2. ブラウザで以下のURLにアクセス:
 *    http://localhost:3000/articles/{記事ID}/opengraph-image
 * 3. または、記事詳細ページのOGP画像URLを確認:
 *    - ブラウザの開発者ツール > Network > 画像リクエストを確認
 *    - または、OGPデバッガー（https://developers.facebook.com/tools/debug/）を使用
 */
import { ImageResponse } from 'next/og'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'edge'
export const alt = '推しノート'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default async function Image({ params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()
    const articleId = Array.isArray(params.id) ? params.id[0] : params.id

    if (!articleId) {
      return generateDefaultImage()
    }

    // 記事情報を取得
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return generateDefaultImage()
    }

    // @ts-ignore - Supabase型定義の問題を回避
    const { data: article, error: articleError } = await supabase
      .from('articles')
      .select('*, oshi(*)')
      .eq('id', articleId)
      .eq('user_id', user.id)
      .single()

    if (articleError || !article) {
      return generateDefaultImage()
    }

    const oshi = (article as any).oshi
    const articleData = article as any
    const highlights = Array.isArray(articleData.highlights)
      ? articleData.highlights.filter((h: any): h is string => typeof h === 'string')
      : []

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #FF6B9D 0%, #C084FC 100%)',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          {/* 推しアイコン */}
          {oshi?.icon_url ? (
            <img
              src={oshi.icon_url}
              alt={oshi.name}
              width={120}
              height={120}
              style={{
                borderRadius: '60px',
                border: '4px solid white',
                marginBottom: '20px',
              }}
            />
          ) : (
            <div
              style={{
                width: 120,
                height: 120,
                borderRadius: '60px',
                background: 'rgba(255, 255, 255, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '20px',
                fontSize: '48px',
              }}
            >
              ✨
            </div>
          )}

          {/* 推し名 */}
          {oshi?.name && (
            <div
              style={{
                fontSize: '32px',
                fontWeight: 'bold',
                color: 'white',
                marginBottom: '10px',
              }}
            >
              {oshi.name}
            </div>
          )}

          {/* 記事タイトル */}
          <div
            style={{
              fontSize: '48px',
              fontWeight: 'bold',
              color: 'white',
              textAlign: 'center',
              maxWidth: '1000px',
              marginBottom: '20px',
              padding: '0 40px',
              lineHeight: '1.2',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {articleData.title}
          </div>

          {/* ハイライト */}
          {highlights.length > 0 && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                maxWidth: '900px',
                padding: '0 40px',
              }}
            >
              {highlights.slice(0, 2).map((highlight: string, index: number) => (
                <div
                  key={index}
                  style={{
                    fontSize: '24px',
                    color: 'rgba(255, 255, 255, 0.9)',
                    background: 'rgba(255, 255, 255, 0.2)',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <span>✨</span>
                  <span>{highlight.substring(0, 60)}{highlight.length > 60 ? '...' : ''}</span>
                </div>
              ))}
            </div>
          )}

          {/* アプリロゴ */}
          <div
            style={{
              position: 'absolute',
              bottom: '40px',
              right: '40px',
              fontSize: '24px',
              fontWeight: 'bold',
              color: 'white',
              background: 'rgba(255, 255, 255, 0.2)',
              padding: '8px 16px',
              borderRadius: '8px',
            }}
          >
            私だけの推しノート 📒
          </div>
        </div>
      ),
      {
        ...size,
      }
    )
  } catch (error) {
    console.error('OGP image generation error:', error)
    return generateDefaultImage()
  }
}

function generateDefaultImage() {
  return new ImageResponse(
    // @ts-ignore - ImageResponse JSX型定義の問題を回避
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #FF6B9D 0%, #C084FC 100%)',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        <div
          style={{
            fontSize: '64px',
            marginBottom: '20px',
          }}
        >
          ✨
        </div>
        <div
          style={{
            fontSize: '48px',
            fontWeight: 'bold',
            color: 'white',
            textAlign: 'center',
          }}
        >
          私だけの推しノート
        </div>
        <div
          style={{
            fontSize: '24px',
            color: 'rgba(255, 255, 255, 0.9)',
            marginTop: '20px',
          }}
        >
          あなただけの推しノートを作成・管理
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
