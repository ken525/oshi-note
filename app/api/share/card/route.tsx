/**
 * シェアカード画像のAPIエンドポイント
 * クエリパラメータでタイトル・ハイライト・推し名を受け取る
 * 
 * 使用例:
 * /api/share/card?title=記事タイトル&oshiName=推し名&highlight=ハイライト1
 */
import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

// React要素の型定義
type ReactElement = {
  type: string
  props: Record<string, any>
  children?: ReactElement[]
}

export const runtime = 'edge'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const title = searchParams.get('title') || '推しノート'
    const oshiName = searchParams.get('oshiName') || ''
    const highlight = searchParams.get('highlight') || ''
    const oshiIconUrl = searchParams.get('oshiIconUrl')

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
          {oshiIconUrl ? (
            <img
              src={oshiIconUrl}
              alt={oshiName || ''}
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

          {oshiName && (
            <div
              style={{
                fontSize: '32px',
                fontWeight: 'bold',
                color: 'white',
                marginBottom: '10px',
              }}
            >
              {oshiName}
            </div>
          )}

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
            {title}
          </div>

          {highlight && (
            <div
              style={{
                fontSize: '24px',
                color: 'rgba(255, 255, 255, 0.9)',
                background: 'rgba(255, 255, 255, 0.2)',
                padding: '8px 16px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                maxWidth: '900px',
              }}
            >
              <span>✨</span>
              <span>{highlight.substring(0, 60)}{highlight.length > 60 ? '...' : ''}</span>
            </div>
          )}

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
    console.error('Share card generation error:', error)
    return new Response('Failed to generate share card', { status: 500 })
  }
}
