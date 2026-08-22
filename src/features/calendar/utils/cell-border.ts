/**
 * 月曆格子的框線。手機與桌機兩份格子都吃這一支。
 *
 * 一律淡格線，當月與非當月的差別交給底色與日期字色——桌機原本給當月加一圈黑框，
 * 手機沒有，兩邊長得不一樣。線只用來分格，不用來強調。
 *
 * 最外圈不畫：那一圈由整個月曆的外框負責，格子再畫一條就變兩倍粗。
 */
export function cellBorder(index: number, total: number): string {
  const isLastCol = index % 7 === 6;
  const isLastRow = index >= total - 7;
  return ["border-rule-soft", isLastCol ? "" : "border-r", isLastRow ? "" : "border-b"]
    .filter(Boolean)
    .join(" ");
}
