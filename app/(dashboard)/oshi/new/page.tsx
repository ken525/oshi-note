/**
 * 新規推し登録ページ
 */
import { OshiForm } from "@/components/features/oshi/OshiForm"

export default function NewOshiPage() {
  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold text-gray-900 dark:text-gray-100">
        推しを登録
      </h1>
      <div className="rounded-2xl bg-white dark:bg-gray-800 p-8 shadow-lg border border-gray-200 dark:border-gray-700">
        <OshiForm />
      </div>
    </div>
  )
}
