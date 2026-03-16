/**
 * Anthropic Claude APIクライアント
 * 記事生成等のAI機能で使用
 */
import Anthropic from '@anthropic-ai/sdk'

const apiKey = process.env.ANTHROPIC_API_KEY

if (!apiKey) {
  console.warn('ANTHROPIC_API_KEY is not set. Claude API features will not work.')
}

export const anthropic = apiKey
  ? new Anthropic({
      apiKey,
    })
  : null
