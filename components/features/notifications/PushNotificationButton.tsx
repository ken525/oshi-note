/**
 * プッシュ通知許可ボタンコンポーネント
 * Webプッシュ通知の許可をリクエスト
 */
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui"
import { Bell, BellOff } from "lucide-react"

export function PushNotificationButton() {
  const [isSupported, setIsSupported] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>("default")
  const [isRequesting, setIsRequesting] = useState(false)

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setIsSupported(true)
      setPermission(Notification.permission)
    }
  }, [])

  const requestPermission = async () => {
    if (!isSupported) return

    setIsRequesting(true)
    try {
      const result = await Notification.requestPermission()
      setPermission(result)

      if (result === "granted") {
        // 通知許可が得られた場合、Service Workerを登録（将来の実装）
        if ("serviceWorker" in navigator) {
          try {
            const registration = await navigator.serviceWorker.ready
            console.log("Service Worker ready for push notifications")
          } catch (error) {
            console.error("Service Worker registration error:", error)
          }
        }
      }
    } catch (error) {
      console.error("Notification permission error:", error)
    } finally {
      setIsRequesting(false)
    }
  }

  if (!isSupported) {
    return null
  }

  if (permission === "granted") {
    return (
      <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
        <Bell className="h-4 w-4" />
        <span>通知が有効です</span>
      </div>
    )
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={requestPermission}
      disabled={isRequesting || permission === "denied"}
      className="flex items-center gap-2"
      aria-label="プッシュ通知を有効にする"
    >
      {permission === "denied" ? (
        <>
          <BellOff className="h-4 w-4" />
          通知が拒否されています
        </>
      ) : (
        <>
          <Bell className="h-4 w-4" />
          {isRequesting ? "処理中..." : "通知を有効にする"}
        </>
      )}
    </Button>
  )
}
