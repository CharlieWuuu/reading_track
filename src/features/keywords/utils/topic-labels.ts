/**
 * ORES articletopic 的分類名對中文。整份刻意不含 Geography——
 * 台灣相關的條目會被地理訊號蓋過主題訊號，那一大類整支忽略。
 */
const TOPIC_LABELS: Record<string, string> = {
  "Culture.Biography.Biography*": "人物",
  "Culture.Biography.Women": "女性人物",
  "Culture.Food_and_drink": "飲食",
  "Culture.Internet_culture": "網路文化",
  "Culture.Linguistics": "語言學",
  "Culture.Literature": "文學",
  "Culture.Media.Books": "書籍",
  "Culture.Media.Entertainment": "娛樂",
  "Culture.Media.Films": "電影",
  "Culture.Media.Media*": "媒體",
  "Culture.Media.Music": "音樂",
  "Culture.Media.Radio": "廣播",
  "Culture.Media.Software": "軟體",
  "Culture.Media.Television": "電視",
  "Culture.Media.Video_games": "電子遊戲",
  "Culture.Performing_arts": "表演藝術",
  "Culture.Philosophy_and_religion": "哲學與宗教",
  "Culture.Sports": "運動",
  "Culture.Visual_arts.Architecture": "建築",
  "Culture.Visual_arts.Comics_and_Anime": "漫畫與動畫",
  "Culture.Visual_arts.Fashion": "時尚",
  "Culture.Visual_arts.Visual_arts*": "視覺藝術",
  "History_and_Society.Business_and_economics": "商業與經濟",
  "History_and_Society.Education": "教育",
  "History_and_Society.History": "歷史",
  "History_and_Society.Military_and_warfare": "軍事與戰爭",
  "History_and_Society.Politics_and_government": "政治與政府",
  "History_and_Society.Society": "社會",
  "History_and_Society.Transportation": "交通運輸",
  "STEM.Biology": "生物學",
  "STEM.Chemistry": "化學",
  "STEM.Computing": "計算機",
  "STEM.Earth_and_environment": "地球與環境",
  "STEM.Engineering": "工程",
  "STEM.Libraries_&_Information": "圖書資訊",
  "STEM.Mathematics": "數學",
  "STEM.Medicine_&_Health": "醫學與健康",
  "STEM.Physics": "物理學",
  "STEM.Space": "太空",
  "STEM.STEM*": "科學技術",
  "STEM.Technology": "科技",
};

/** 主檔裡舊的列存的是英文葉節點名，用結尾比對也認得出來 */
const BY_LEAF = new Map(
  Object.entries(TOPIC_LABELS).map(([path, label]) => [path.split(".").pop() ?? path, label]),
);

/** 認不出來的原樣回傳，寧可顯示英文也不要吞掉資料 */
export function topicLabel(topic: string): string {
  const name = topic.trim();
  if (!name) return "";
  return TOPIC_LABELS[name] ?? BY_LEAF.get(name.split(".").pop() ?? name) ?? name;
}
