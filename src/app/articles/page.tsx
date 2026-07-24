import { PageHeader } from "@/components/layout/PageHeader";

export default function ArticlesPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="文章紀錄" />
      <div className="rounded-lg border bg-white p-8 text-center text-sm text-gray-500">
        尚未實作，之後會顯示自動爬蟲推送到 Instapaper 的文章
      </div>
    </div>
  );
}
