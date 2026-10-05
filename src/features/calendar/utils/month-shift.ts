export type YearMonth = { year: number; month: number }; // month 從 0 起，跟 Date 一樣

export const shiftMonth = ({ year, month }: YearMonth, delta: number): YearMonth => {
  const total = year * 12 + month + delta;
  return { year: Math.floor(total / 12), month: ((total % 12) + 12) % 12 };
};

export const isSameMonth = (a: YearMonth, b: YearMonth): boolean =>
  a.year === b.year && a.month === b.month;

export const yearMonthOf = (date: Date): YearMonth => ({
  year: date.getFullYear(),
  month: date.getMonth(),
});
