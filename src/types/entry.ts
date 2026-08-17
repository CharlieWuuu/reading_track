/**
 * 一件事，加上我怎麼想。
 *
 * 工作、輸出、反思、日記、程式共用同一張表：欄位完全一樣，分開只會逼你
 * 在記錄前先做一個沒有後果的分類，那是純摩擦力。要分開看就用「類型」篩。
 *
 * 這裡刻意不存事件本身（軌跡、時數、commit）。那些留在原本的系統裡，
 * 需要時用「連結」指過去——這張表只放經過思考的東西。
 */
export interface Entry {
  id: string;
  /** 只有一個日期：這件事發生／我想到它的那天 */
  date: string | null;
  title: string;
  /** 工作／輸出／反思／日記／程式，可自訂 */
  kind: string;
  domain: string;
  subDomain: string;
  keywords: string;
  /** 主體。其他欄位都是為了讓這一欄好找 */
  note: string;
  /**
   * 這件事的原始出處。網址（PR、部落格、Strava）或純文字都可以——
   * 「紙本日記 8/17」「Obsidian／求職筆記」也是有效的來源，不是每件事都在線上。
   */
  link: string;
}
