import { afterEach, describe, expect, it, vi } from "vitest";
import {
  dayLabel,
  fromDateTimeInput,
  now,
  parseDate,
  timeLabel,
  toDateTimeInput,
  today,
  whenLabel,
} from "./date";

/** 假時間一律用本地時區的那一刻，這幾支函式全是照本地時區算的 */
function freeze(local: string) {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(local));
}

afterEach(() => {
  vi.useRealTimers();
});

describe("today / now", () => {
  // 早期用 toISOString().slice(0,10)，台灣時間早上八點前會拿到昨天
  it("清晨也是今天，不會倒退一天", () => {
    freeze("2026-08-19T01:30:00");
    expect(today()).toBe("2026-08-19");
  });

  it("月份與日期補到兩位", () => {
    freeze("2026-01-05T10:00:00");
    expect(today()).toBe("2026-01-05");
  });

  it("now 記到分鐘，中間是空白不是 T", () => {
    freeze("2026-08-19T09:05:00");
    expect(now()).toBe("2026-08-19 09:05");
  });
});

describe("parseDate", () => {
  // new Date("2026-08-19") 會被當成 UTC 午夜，在西半球會倒退一天
  it("只有日期的字串當成當地的那一天", () => {
    const date = parseDate("2026-08-19");
    expect(date?.getFullYear()).toBe(2026);
    expect(date?.getMonth()).toBe(7);
    expect(date?.getDate()).toBe(19);
    expect(date?.getHours()).toBe(0);
  });

  it("空白或 T 分隔的時間都認", () => {
    expect(parseDate("2026-08-19 14:32")?.getHours()).toBe(14);
    expect(parseDate("2026-08-19T14:32")?.getMinutes()).toBe(32);
  });

  it("空值與壞字串回 null", () => {
    for (const value of [null, undefined, "", "   ", "不是日期"]) {
      expect(parseDate(value)).toBeNull();
    }
  });
});

describe("timeLabel", () => {
  it("有時間就顯示時間", () => {
    expect(timeLabel("2026-08-19 14:32")).toBe("14:32");
  });

  // 舊資料只有日期，補一個 00:00 會讓人以為那是真的記錄時間
  it("只有日期就給空字串，不憑空長出 00:00", () => {
    expect(timeLabel("2026-08-19")).toBe("");
    expect(timeLabel(null)).toBe("");
  });
});

describe("dayLabel", () => {
  it("今天、昨天講關係", () => {
    freeze("2026-08-19T10:00:00");
    expect(dayLabel("2026-08-19")).toBe("今天");
    expect(dayLabel("2026-08-18")).toBe("昨天");
  });

  it("一週內講星期幾", () => {
    freeze("2026-08-19T10:00:00"); // 週三
    expect(dayLabel("2026-08-16")).toBe("週日");
  });

  // 過了一週「11 天前」還是得換算，不如直接給日期
  it("超過一週改講日期", () => {
    freeze("2026-08-19T10:00:00");
    expect(dayLabel("2026-08-01")).toBe("8/1");
  });

  it("跨年就把年份也帶上", () => {
    freeze("2026-08-19T10:00:00");
    expect(dayLabel("2025-12-31")).toBe("2025/12/31");
  });

  it("未來的日期不會被講成今天", () => {
    freeze("2026-08-19T10:00:00");
    expect(dayLabel("2026-08-25")).toBe("8/25");
  });

  it("壞字串給空字串", () => {
    expect(dayLabel("不是日期")).toBe("");
  });
});

describe("whenLabel", () => {
  it("今天只給時間，「今天」兩個字等於沒講", () => {
    freeze("2026-08-19T18:00:00");
    expect(whenLabel("2026-08-19 14:32")).toBe("14:32");
  });

  // 「上週三 14:32」的時分沒有人會用到
  it("昨天以前不帶時分", () => {
    freeze("2026-08-19T18:00:00");
    expect(whenLabel("2026-08-18 14:32")).toBe("昨天");
    expect(whenLabel("2026-08-16 14:32")).toBe("週日");
    expect(whenLabel("2026-08-01 14:32")).toBe("8/1");
  });

  it("今天但沒記時間就退回「今天」", () => {
    freeze("2026-08-19T18:00:00");
    expect(whenLabel("2026-08-19")).toBe("今天");
  });

  it("壞字串給空字串", () => {
    expect(whenLabel("不是日期")).toBe("");
  });
});

describe("datetime-local 的來回", () => {
  it("Sheet 的空白分隔換成 T", () => {
    expect(toDateTimeInput("2026-08-19 14:32")).toBe("2026-08-19T14:32");
  });

  it("只有日期時補 00:00，input 才填得進去", () => {
    expect(toDateTimeInput("2026-08-19")).toBe("2026-08-19T00:00");
  });

  it("空字串進空字串出", () => {
    expect(toDateTimeInput("  ")).toBe("");
  });

  it("換回來是空白分隔，秒數不留", () => {
    expect(fromDateTimeInput("2026-08-19T14:32:10")).toBe("2026-08-19 14:32");
  });
});
