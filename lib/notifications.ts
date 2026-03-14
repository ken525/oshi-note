/**
 * プッシュ通知ユーティリティ
 * 記事生成完了時の通知など
 */

/**
 * 記事生成完了通知を表示
 */
export function showArticleGeneratedNotification(
  title: string,
  oshiName: string
) {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return
  }

  if (Notification.permission === "granted") {
    const notification = new Notification("推しノートが更新されました！", {
      body: `${oshiName}の新しい記事「${title}」が生成されました`,
      icon: "/icon-192x192.png",
      badge: "/icon-192x192.png",
      tag: "article-generated",
      requireInteraction: false,
    })

    notification.onclick = () => {
      window.focus()
      notification.close()
    }

    // 5秒後に自動的に閉じる
    setTimeout(() => {
      notification.close()
    }, 5000)
  }
}

/**
 * 通知が許可されているかチェック
 */
export function isNotificationPermissionGranted(): boolean {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return false
  }
  return Notification.permission === "granted"
}
