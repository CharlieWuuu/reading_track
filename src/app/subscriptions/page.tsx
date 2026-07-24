import { PageHeader } from "@/components/layout/PageHeader";

export default function SubscriptionsPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="文章訂閱" />
      <div className="rounded-lg border bg-white p-8 text-center text-sm text-gray-500">
        尚未實作，之後可在這裡自訂爬蟲網站清單（例如讀者、轉角國際），推送到
        Instapaper
      </div>
    </div>
  );
}
