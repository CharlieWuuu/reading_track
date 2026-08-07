"use client";

/** 頁面層級的訊息框（載入中／未連接／空清單／錯誤），各頁長得一致 */
export function PageMessage({
  children,
  tone = "muted",
  fill = false,
}: {
  children: React.ReactNode;
  tone?: "muted" | "error";
  fill?: boolean;
}) {
  return (
    <div
      className={`w-full rounded-lg border bg-white p-8 text-center text-sm ${
        tone === "error" ? "text-red-600" : "text-gray-500"
      } ${fill ? "flex min-h-0 flex-1 items-center justify-center" : ""}`}
    >
      {children}
    </div>
  );
}
