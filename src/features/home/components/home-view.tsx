"use client";

import { useSession } from "next-auth/react";
import { PageLoading } from "@/components/layout/page-loading";
import { Dashboard } from "./dashboard";
import { Landing } from "./landing";

/** 同一個網址兩張臉：沒登入是落地頁，登入後是今天的摘要 */
export function HomeView() {
  const { status } = useSession();

  if (status === "loading") return <PageLoading />;
  return status === "authenticated" ? <Dashboard /> : <Landing />;
}
