import { redirect } from "next/navigation";

/** 新增類型搬到設定頁了。舊網址還在外面（書籤、側欄的舊快取），轉過去不留死路 */
export default function NewKindRedirect() {
  redirect("/settings?tab=kinds");
}
