/**
 * 清單上方那一條「現在看的是哪一批、有幾筆」。
 *
 * 數量放在標題旁邊而不是另外一行：它回答的是同一個問題的後半句
 * （「已讀完的有 40 本」），拆成兩處要看兩次。
 *
 * 右邊那條線把標題與後面的空白連起來，一眼看得出這是一段的開頭，
 * 而不是浮在上面的一句話。跟書寫時間軸的週標題同一種做法。
 */
export function ListHeading({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex shrink-0 items-center gap-3">
      <span className="shrink-0 text-xs font-medium text-gray-700">
        {label}
        <span className="ml-1 text-gray-400 tabular-nums">（{count}）</span>
      </span>
      <span className="bg-rule h-px flex-1" />
    </div>
  );
}
