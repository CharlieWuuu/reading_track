/**
 * 未登入首頁的文案。三堆的說明與 SPEC 同一套字，範例條目是示意用的假資料——
 * 沒登入就沒有真資料可讀，這一頁講的是「這裡放什麼」。
 */

export type LandingSection = {
  title: string;
  tag: string;
  body: string;
  sample: { kind: string; title: string; meta: string };
};

export const LANDING_HERO = {
  title: "抓住思緒碎片",
  lede: "最近讀了什麼？學到什麼？想到什麼？讓 Archivum 幫你轉成個人生活的週報。",
};

export const LANDING_SECTIONS: LandingSection[] = [
  {
    title: "紀錄",
    tag: "各色體驗",
    body: "最近接觸到什麼？是一本暢銷新書、一首難忘的歌、一場午夜電影、一段壯闊旅程？一起記下來，產生個人化的體驗週報。",
    sample: { kind: "書籍", title: "原子習慣", meta: "James Clear・320 頁・在讀" },
  },
  {
    title: "片段",
    tag: "知識碎片",
    body: "單字、關鍵字，甚至書本、電影的佳句。雖然還沒有什麼想法，但想留存下來的吉光片羽。",
    sample: {
      kind: "佳句",
      title: "而當你真心渴望某樣東西時，整個宇宙都會聯合起來幫助你完成。",
      meta: "牧羊少年奇幻之旅・第一部",
    },
  },
  {
    title: "專欄",
    tag: "想說的話",
    body: "近期生活的感觸，凝結成想說的話。日記、心得、論述、每日計畫都不設限。",
    sample: {
      kind: "心得",
      title: "還沒，不是不會",
      meta: "520 字・出處 心態致勝：全新成功心理學",
    },
  },
];
