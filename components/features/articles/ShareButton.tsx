/**
 * 共有ボタンコンポーネント
 * X（Twitter）共有
 */
"use client"

import { Twitter } from "lucide-react"
import { Button } from "@/components/ui"

interface ShareButtonProps {
  title: string
  url: string
}

export function ShareButton({ title, url }: ShareButtonProps) {
  const handleShare = () => {
    const text = encodeURIComponent(title)
    const shareUrl = encodeURIComponent(url)
    const twitterUrl = `https://twitter.com/intent/tweet?text=${text}&url=${shareUrl}`
    window.open(twitterUrl, "_blank", "width=550,height=420")
  }

  return (
    <Button
      variant="outline"
      onClick={handleShare}
      className="flex items-center gap-2"
    >
      <Twitter className="h-4 w-4" />
      Xで共有
    </Button>
  )
}
