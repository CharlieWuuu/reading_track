import { redirect } from "next/navigation";

/** 統計本身沒有內容，預設看書籍 */
export default function StatsPage() {
  redirect("/stats/books");
}
