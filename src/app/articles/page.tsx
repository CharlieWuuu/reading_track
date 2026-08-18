import { redirect } from "next/navigation";

/** 文章併進「閱讀紀錄」那一頁了，舊網址與返回連結仍然導得過去 */
export default function ArticlesPage() {
  redirect("/books?type=article");
}
