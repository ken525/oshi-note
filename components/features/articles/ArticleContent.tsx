/**
 * 記事コンテンツコンポーネント
 * Markdownレンダリング
 */
"use client"

import ReactMarkdown from "react-markdown"
import remarkBreaks from "remark-breaks"
import remarkGfm from "remark-gfm"

interface ArticleContentProps {
  content: string
}

/** 保存されている \n を改行にし、段落がMarkdownで正しく解釈されるようにする */
function normalizeContent(content: string): string {
  if (!content) return ''
  return content.replace(/\\n/g, '\n')
}

export function ArticleContent({ content }: ArticleContentProps) {
  const normalized = normalizeContent(content)
  return (
    <div className="prose prose-lg max-w-none dark:prose-invert prose-headings:font-bold prose-headings:text-gray-900 dark:prose-headings:text-gray-100 prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-a:text-pink-600 dark:prose-a:text-pink-400 prose-a:no-underline hover:prose-a:underline prose-strong:text-gray-900 dark:prose-strong:text-gray-100">
      <ReactMarkdown remarkPlugins={[remarkBreaks, remarkGfm]}>{normalized}</ReactMarkdown>
    </div>
  )
}
