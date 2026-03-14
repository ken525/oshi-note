/**
 * Anthropic Claude APIクライアント
 * 記事生成等のAI機能で使用
 */
import Anthropic from '@anthropic-ai/sdk'

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})
